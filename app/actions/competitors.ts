"use server";

import { z } from "zod";

import { getChannelConnectionAction } from "@/app/actions/youtube";
import { safeRun } from "@/lib/actions/safe";
import { discoverCompetitorsForChannel, discoverCompetitorsByNiche } from "@/lib/competitors/discover";
import type { DiscoveredCompetitor } from "@/lib/competitors/discover";
import {
  getDiscoveryCacheEntry,
  isDiscoveryCached,
  markDiscoveryComplete,
} from "@/lib/competitors/discovery-cache";
import {
  COMPETITOR_COOKIE_LIMIT,
  getCompetitorsFromCookie,
  removeCompetitorFromCookie,
  saveCompetitorsToCookie,
  upsertCompetitorInCookie,
} from "@/lib/competitors/store";
import type {
  CompetitorActionErrorCode,
  CompetitorActionResult,
  CompetitorRow,
} from "@/lib/actions/types/competitors";
import { resolveActor } from "@/lib/storage/actor";
import { isYouTubeConfigured, resolveChannelStats } from "@/lib/youtube/api";
import { parseChannelInput } from "@/lib/youtube/parse";

const COMPETITOR_LIMIT = COMPETITOR_COOKIE_LIMIT;

function compErr(
  code: CompetitorActionErrorCode,
  details?: string
): Extract<CompetitorActionResult<never>, { ok: false }> {
  return { ok: false, error: { code, details } };
}

async function getDbUserContext() {
  const actor = await resolveActor();
  if (actor.isGuest) return null;
  return { supabase: actor.supabase, userId: actor.actorId };
}

function mapRow(row: {
  id: string;
  youtube_channel_id: string;
  channel_name: string | null;
  channel_url: string | null;
  stats_cache: unknown;
  channel_data: unknown;
  tracked_since: string;
  last_updated: string | null;
}): CompetitorRow {
  const stats = (row.stats_cache ?? {}) as Record<string, number>;
  const data = (row.channel_data ?? {}) as Record<string, string | boolean | null>;
  return {
    id: row.id,
    youtubeChannelId: row.youtube_channel_id,
    channelName: row.channel_name ?? (data.title as string) ?? "Unknown channel",
    channelUrl: row.channel_url,
    subscriberCount: Number(stats.subscriberCount ?? 0),
    viewCount: Number(stats.viewCount ?? 0),
    videoCount: Number(stats.videoCount ?? 0),
    thumbnailUrl: (data.thumbnailUrl as string) ?? null,
    trackedSince: row.tracked_since,
    lastUpdated: row.last_updated,
    autoDiscovered: data.autoDiscovered === true,
  };
}

function buildCookieCompetitor(
  stats: NonNullable<Awaited<ReturnType<typeof resolveChannelStats>>>,
  channelUrl: string,
  autoDiscovered = false
): CompetitorRow {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    youtubeChannelId: stats.youtubeChannelId,
    channelName: stats.title,
    channelUrl: channelUrl.trim(),
    subscriberCount: stats.subscriberCount,
    viewCount: stats.viewCount,
    videoCount: stats.videoCount,
    thumbnailUrl: stats.thumbnailUrl,
    trackedSince: now,
    lastUpdated: now,
    autoDiscovered,
  };
}

async function insertDiscoveredCompetitor(
  actorId: string,
  stats: NonNullable<Awaited<ReturnType<typeof resolveChannelStats>>>,
  channelUrl: string,
  db: NonNullable<Awaited<ReturnType<typeof getDbUserContext>>>
): Promise<CompetitorRow | null> {
  const { count } = await db.supabase
    .from("competitors")
    .select("id", { count: "exact", head: true })
    .eq("user_id", db.userId);

  if ((count ?? 0) >= COMPETITOR_LIMIT) return null;

  const { data: dup } = await db.supabase
    .from("competitors")
    .select("id")
    .eq("user_id", db.userId)
    .eq("youtube_channel_id", stats.youtubeChannelId)
    .maybeSingle();

  if (dup) return null;

  const { data, error } = await db.supabase
    .from("competitors")
    .insert({
      user_id: db.userId,
      youtube_channel_id: stats.youtubeChannelId,
      channel_name: stats.title,
      channel_url: channelUrl,
      channel_data: { title: stats.title, thumbnailUrl: stats.thumbnailUrl, autoDiscovered: true },
      stats_cache: {
        subscriberCount: stats.subscriberCount,
        viewCount: stats.viewCount,
        videoCount: stats.videoCount,
      },
      last_updated: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (!error && data) {
    const competitor = mapRow(data);
    upsertCompetitorInCookie(actorId, competitor);
    return competitor;
  }
  return null;
}

export async function listCompetitorsAction(): Promise<
  CompetitorActionResult<{ competitors: CompetitorRow[] }>
> {
  try {
    const { actorId } = await resolveActor();
    const cookieCompetitors = getCompetitorsFromCookie(actorId);

    const db = await getDbUserContext();
    if (db) {
      const { data, error } = await db.supabase
        .from("competitors")
        .select("*")
        .eq("user_id", db.userId)
        .order("tracked_since", { ascending: true });

      if (!error && (data ?? []).length > 0) {
        return { ok: true, data: { competitors: data.map(mapRow) } };
      }
    }

    return { ok: true, data: { competitors: cookieCompetitors } };
  } catch (err) {
    console.error("[server-action:listCompetitors]", err);
    try {
      const { actorId } = await resolveActor();
      return { ok: true, data: { competitors: getCompetitorsFromCookie(actorId) } };
    } catch {
      return { ok: true, data: { competitors: [] } };
    }
  }
}

const AddSchema = z.object({ channelUrl: z.string().min(3).max(500) });

export async function addCompetitorAction(
  input: z.infer<typeof AddSchema>
): Promise<CompetitorActionResult<{ competitor: CompetitorRow }>> {
  return safeRun(
    async () => {
      const parsed = AddSchema.safeParse(input);
      if (!parsed.success) return compErr("INVALID_URL");

      const { actorId } = await resolveActor();
      const existingCookie = getCompetitorsFromCookie(actorId);

      const ref = parseChannelInput(parsed.data.channelUrl);
      if (!ref) return compErr("INVALID_URL");

      const stats = await resolveChannelStats(ref);
      if (!stats) return compErr("NOT_FOUND");

      const db = await getDbUserContext();

      if (db) {
        const { count } = await db.supabase
          .from("competitors")
          .select("id", { count: "exact", head: true })
          .eq("user_id", db.userId);

        if ((count ?? 0) >= COMPETITOR_LIMIT) return compErr("LIMIT_REACHED");

        const { data: dup } = await db.supabase
          .from("competitors")
          .select("id")
          .eq("user_id", db.userId)
          .eq("youtube_channel_id", stats.youtubeChannelId)
          .maybeSingle();

        if (dup) return compErr("DUPLICATE");

        const { data, error } = await db.supabase
          .from("competitors")
          .insert({
            user_id: db.userId,
            youtube_channel_id: stats.youtubeChannelId,
            channel_name: stats.title,
            channel_url: parsed.data.channelUrl.trim(),
            channel_data: { title: stats.title, thumbnailUrl: stats.thumbnailUrl },
            stats_cache: {
              subscriberCount: stats.subscriberCount,
              viewCount: stats.viewCount,
              videoCount: stats.videoCount,
            },
            last_updated: new Date().toISOString(),
          })
          .select("*")
          .single();

        if (!error && data) {
          const competitor = mapRow(data);
          upsertCompetitorInCookie(actorId, competitor);
          return { ok: true, data: { competitor } };
        }
      }

      if (existingCookie.length >= COMPETITOR_LIMIT) return compErr("LIMIT_REACHED");
      if (existingCookie.some((c) => c.youtubeChannelId === stats.youtubeChannelId)) {
        return compErr("DUPLICATE");
      }

      const competitor = buildCookieCompetitor(stats, parsed.data.channelUrl);
      upsertCompetitorInCookie(actorId, competitor);
      return { ok: true, data: { competitor } };
    },
    (details) => compErr("DB_ERROR", details),
    "addCompetitor"
  );
}

export async function refreshCompetitorAction(
  id: string
): Promise<CompetitorActionResult<{ competitor: CompetitorRow }>> {
  return safeRun(
    async () => {
      const { actorId } = await resolveActor();
      const db = await getDbUserContext();

      if (db) {
        const { data: row, error } = await db.supabase
          .from("competitors")
          .select("*")
          .eq("id", id)
          .eq("user_id", db.userId)
          .maybeSingle();

        if (!error && row) {
          const stats = await resolveChannelStats({ type: "id", value: row.youtube_channel_id });
          if (!stats) return compErr("YOUTUBE_ERROR");

          const existingData = (row.channel_data ?? {}) as Record<string, unknown>;
          const { data: updated, error: updateError } = await db.supabase
            .from("competitors")
            .update({
              channel_name: stats.title,
              channel_data: {
                title: stats.title,
                thumbnailUrl: stats.thumbnailUrl,
                autoDiscovered: existingData.autoDiscovered === true,
              },
              stats_cache: {
                subscriberCount: stats.subscriberCount,
                viewCount: stats.viewCount,
                videoCount: stats.videoCount,
              },
              last_updated: new Date().toISOString(),
            })
            .eq("id", id)
            .select("*")
            .single();

          if (!updateError && updated) {
            const competitor = mapRow(updated);
            upsertCompetitorInCookie(actorId, competitor);
            return { ok: true, data: { competitor } };
          }
        }
      }

      const items = getCompetitorsFromCookie(actorId);
      const idx = items.findIndex((c) => c.id === id);
      if (idx < 0) return compErr("NOT_FOUND");

      const existing = items[idx];
      const stats = await resolveChannelStats({ type: "id", value: existing.youtubeChannelId });
      if (!stats) return compErr("YOUTUBE_ERROR");

      const updated: CompetitorRow = {
        ...existing,
        channelName: stats.title,
        subscriberCount: stats.subscriberCount,
        viewCount: stats.viewCount,
        videoCount: stats.videoCount,
        thumbnailUrl: stats.thumbnailUrl,
        lastUpdated: new Date().toISOString(),
      };
      const next = [...items];
      next[idx] = updated;
      saveCompetitorsToCookie(actorId, next);
      return { ok: true, data: { competitor: updated } };
    },
    (details) => compErr("DB_ERROR", details),
    "refreshCompetitor"
  );
}

export async function removeCompetitorAction(
  id: string
): Promise<CompetitorActionResult<{ removed: true }>> {
  return safeRun(
    async () => {
      const { actorId } = await resolveActor();
      const removedFromCookie = removeCompetitorFromCookie(actorId, id);

      const db = await getDbUserContext();
      if (db) {
        const { data, error } = await db.supabase
          .from("competitors")
          .delete()
          .eq("id", id)
          .eq("user_id", db.userId)
          .select("id");

        if (!error && data?.length) return { ok: true, data: { removed: true } };
      }

      if (removedFromCookie) return { ok: true, data: { removed: true } };
      return compErr("NOT_FOUND");
    },
    (details) => compErr("DB_ERROR", details),
    "removeCompetitor"
  );
}

export async function refreshAllCompetitorsAction(): Promise<
  CompetitorActionResult<{ count: number }>
> {
  return safeRun(
    async () => {
      const list = await listCompetitorsAction();
      if (!list.ok) return list;
      let count = 0;
      for (const c of list.data.competitors) {
        const res = await refreshCompetitorAction(c.id);
        if (res.ok) count += 1;
      }
      return { ok: true, data: { count } };
    },
    (details) => compErr("DB_ERROR", details),
    "refreshAllCompetitors"
  );
}

async function persistDiscoveredCompetitors(
  actorId: string,
  discovered: DiscoveredCompetitor[]
): Promise<number> {
  const db = await getDbUserContext();
  let added = 0;
  const cookieCompetitors = getCompetitorsFromCookie(actorId);

  for (const candidate of discovered) {
    if (added + cookieCompetitors.length >= COMPETITOR_LIMIT) break;

    if (db) {
      const row = await insertDiscoveredCompetitor(
        actorId,
        candidate,
        candidate.channelUrl,
        db
      );
      if (row) {
        added += 1;
        continue;
      }
    }

    if (cookieCompetitors.some((c) => c.youtubeChannelId === candidate.youtubeChannelId)) {
      continue;
    }
    if (getCompetitorsFromCookie(actorId).length >= COMPETITOR_LIMIT) break;

    const competitor = buildCookieCompetitor(candidate, candidate.channelUrl, true);
    upsertCompetitorInCookie(actorId, competitor);
    added += 1;
  }

  return added;
}

const AUTO_DISCOVER_LIMIT = 5;

type DiscoveryActionData = {
  added: number;
  skipped: boolean;
  suggestManualNiche: boolean;
};

/** Auto-discovers competitors for the connected YouTube channel based on niche keywords. */
export async function autoDiscoverCompetitorsAction(): Promise<
  CompetitorActionResult<DiscoveryActionData>
> {
  return safeRun(
    async () => {
      if (!isYouTubeConfigured()) return compErr("NOT_CONFIGURED");

      const connection = await getChannelConnectionAction();
      if (!connection.ok || !connection.data.connected) return compErr("NOT_CONNECTED");

      const youtubeChannelId = connection.data.channel.youtubeChannelId;
      const { actorId } = await resolveActor();

      const existing = await listCompetitorsAction();
      if (existing.ok && existing.data.competitors.length > 0) {
        return { ok: true, data: { added: 0, skipped: true, suggestManualNiche: false } };
      }

      if (isDiscoveryCached(actorId, youtubeChannelId)) {
        const cacheEntry = getDiscoveryCacheEntry(actorId);
        const suggestManualNiche =
          cacheEntry?.channelId === youtubeChannelId && (cacheEntry.addedCount ?? 0) === 0;
        return { ok: true, data: { added: 0, skipped: true, suggestManualNiche } };
      }

      const { competitors, nicheDetected } = await discoverCompetitorsForChannel(
        youtubeChannelId,
        AUTO_DISCOVER_LIMIT
      );

      const added = await persistDiscoveredCompetitors(actorId, competitors);

      markDiscoveryComplete(actorId, youtubeChannelId, added);
      const suggestManualNiche = !nicheDetected || added === 0;
      return { ok: true, data: { added, skipped: false, suggestManualNiche } };
    },
    (details) => compErr("DB_ERROR", details),
    "autoDiscoverCompetitors"
  );
}

const NicheSchema = z.object({ niche: z.string().trim().min(2).max(120) });

/** Discovers competitors from a user-provided niche keyword via YouTube search. */
export async function discoverCompetitorsByNicheAction(
  input: z.infer<typeof NicheSchema>
): Promise<CompetitorActionResult<DiscoveryActionData>> {
  return safeRun(
    async () => {
      if (!isYouTubeConfigured()) return compErr("NOT_CONFIGURED");

      const parsed = NicheSchema.safeParse(input);
      if (!parsed.success) return compErr("INVALID_NICHE");

      const connection = await getChannelConnectionAction();
      const excludeChannelId =
        connection.ok && connection.data.connected
          ? connection.data.channel.youtubeChannelId
          : null;

      const { actorId } = await resolveActor();
      const existing = await listCompetitorsAction();
      if (existing.ok && existing.data.competitors.length >= COMPETITOR_LIMIT) {
        return compErr("LIMIT_REACHED");
      }

      const discovered = await discoverCompetitorsByNiche(
        parsed.data.niche,
        excludeChannelId,
        AUTO_DISCOVER_LIMIT
      );

      if (discovered.length === 0) {
        return { ok: true, data: { added: 0, skipped: false, suggestManualNiche: true } };
      }

      const added = await persistDiscoveredCompetitors(actorId, discovered);
      if (excludeChannelId) {
        markDiscoveryComplete(actorId, excludeChannelId, added);
      }

      return {
        ok: true,
        data: { added, skipped: false, suggestManualNiche: added === 0 },
      };
    },
    (details) => compErr("DB_ERROR", details),
    "discoverCompetitorsByNiche"
  );
}
