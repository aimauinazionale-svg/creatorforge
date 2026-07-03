"use server";

import { z } from "zod";

import { requireChannel, type ChannelContext } from "@/lib/actions/auth-context";
import { safeRun } from "@/lib/actions/safe";
import {
  SCHEDULED_VIDEO_STATUSES,
  type CalendarActionErrorCode,
  type CalendarActionResult,
  type ScheduledVideoRow,
  type ScheduledVideoStatus,
} from "@/lib/actions/types/calendar";
import {
  createScheduledVideoCookie,
  deleteScheduledVideoCookie,
  listScheduledVideosCookie,
  updateScheduledVideoCookie,
} from "@/lib/calendar/store";
import { resolveActor } from "@/lib/storage/actor";
import { isSupabaseSchemaError, logSupabaseError } from "@/lib/supabase/errors";
import { fetchChannelVideos } from "@/lib/youtube/api";
import type { Database } from "@/types/database";

const GetScheduledVideosInputSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

const CreateScheduledVideoInputSchema = z.object({
  title: z.string().min(2).max(200),
  scheduledAt: z.string().datetime(),
  status: z.enum(SCHEDULED_VIDEO_STATUSES).optional(),
  notes: z.string().max(5000).optional().nullable(),
  ideaId: z.string().uuid().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
});

const UpdateScheduledVideoInputSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(SCHEDULED_VIDEO_STATUSES).optional(),
  notes: z.string().max(5000).optional().nullable(),
  ideaId: z.string().uuid().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
});

type CalendarContext = Pick<ChannelContext, "userId" | "channelId" | "fromCookie" | "supabase">;

function calErr(
  code: CalendarActionErrorCode
): Extract<CalendarActionResult<never>, { ok: false }> {
  return { ok: false, error: { code } };
}

async function resolveCalendarContext(): Promise<
  CalendarActionResult<CalendarContext> | Extract<CalendarActionResult<never>, { ok: false }>
> {
  const ctx = await requireChannel();
  if (ctx.ok) {
    return {
      ok: true,
      data: {
        userId: ctx.data.userId,
        channelId: ctx.data.channelId,
        fromCookie: ctx.data.fromCookie,
        supabase: ctx.data.supabase,
      },
    };
  }

  const actor = await resolveActor();
  return {
    ok: true,
    data: {
      userId: actor.actorId,
      channelId: actor.actorId,
      fromCookie: true,
      supabase: actor.supabase,
    },
  };
}

function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function isValidStatus(value: string): value is ScheduledVideoStatus {
  return (SCHEDULED_VIDEO_STATUSES as readonly string[]).includes(value);
}

function mapRow(row: {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  idea_id: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}): ScheduledVideoRow | null {
  const status = normalizeText(row.status);
  if (!status || !isValidStatus(status)) return null;
  return {
    id: row.id,
    title: row.title,
    scheduledAt: row.scheduled_at,
    status,
    notes: row.notes,
    ideaId: row.idea_id,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function computeBestTimeRecommendation(published: string[]): {
  weekday: number;
  hour: number;
  confidence: number;
  sampleSize: number;
} | null {
  if (published.length < 8) return null;

  const counts = new Map<string, number>();
  for (const iso of published) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getUTCDay()}:${d.getUTCHours()}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let bestKey: string | null = null;
  let bestCount = 0;
  for (const [key, count] of counts.entries()) {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }

  if (!bestKey) return null;
  const [weekdayStr, hourStr] = bestKey.split(":");
  const weekday = Number(weekdayStr);
  const hour = Number(hourStr);
  const confidence = Math.min(100, Math.round((bestCount / published.length) * 100));

  return { weekday, hour, confidence, sampleSize: published.length };
}

export async function getScheduledVideosAction(
  input: z.infer<typeof GetScheduledVideosInputSchema>
): Promise<CalendarActionResult<{ videos: ScheduledVideoRow[] }>> {
  try {
    const parsed = GetScheduledVideosInputSchema.safeParse(input);
    if (!parsed.success) return calErr("INVALID_INPUT");

    const ctx = await resolveCalendarContext();
    if (!ctx.ok) return { ok: true, data: { videos: [] } };

    if (ctx.data.fromCookie) {
      return {
        ok: true,
        data: {
          videos: listScheduledVideosCookie(
            ctx.data.userId,
            ctx.data.channelId,
            parsed.data.start,
            parsed.data.end
          ),
        },
      };
    }

    const { data, error } = await ctx.data.supabase
      .from("scheduled_videos")
      .select("id,title,scheduled_at,status,notes,idea_id,thumbnail_url,created_at,updated_at")
      .eq("channel_id", ctx.data.channelId)
      .gte("scheduled_at", parsed.data.start)
      .lt("scheduled_at", parsed.data.end)
      .order("scheduled_at", { ascending: true });

    if (error) {
      return {
        ok: true,
        data: {
          videos: listScheduledVideosCookie(
            ctx.data.userId,
            ctx.data.channelId,
            parsed.data.start,
            parsed.data.end
          ),
        },
      };
    }

    const videos = (data ?? [])
      .map(mapRow)
      .filter((v): v is ScheduledVideoRow => Boolean(v));

    return { ok: true, data: { videos } };
  } catch (err) {
    console.error("[server-action:getScheduledVideos]", err);
    return { ok: true, data: { videos: [] } };
  }
}

export async function createScheduledVideoAction(
  input: z.infer<typeof CreateScheduledVideoInputSchema>
): Promise<CalendarActionResult<{ video: ScheduledVideoRow }>> {
  return safeRun(
    async () => {
      const parsed = CreateScheduledVideoInputSchema.safeParse(input);
      if (!parsed.success) return calErr("INVALID_INPUT");

      const ctx = await resolveCalendarContext();
      if (!ctx.ok) return ctx;

      const payload = {
        userId: ctx.data.userId,
        channelId: ctx.data.channelId,
        title: parsed.data.title.trim(),
        scheduledAt: parsed.data.scheduledAt,
        status: parsed.data.status ?? "planned",
        notes: normalizeText(parsed.data.notes) ?? null,
        ideaId: normalizeText(parsed.data.ideaId) ?? null,
        thumbnailUrl: normalizeText(parsed.data.thumbnailUrl) ?? null,
      };

      if (ctx.data.fromCookie) {
        return { ok: true, data: { video: createScheduledVideoCookie(payload) } };
      }

      const { data, error } = await ctx.data.supabase
        .from("scheduled_videos")
        .insert({
          user_id: ctx.data.userId,
          channel_id: ctx.data.channelId,
          title: payload.title,
          scheduled_at: payload.scheduledAt,
          status: payload.status,
          notes: payload.notes,
          idea_id: payload.ideaId,
          thumbnail_url: payload.thumbnailUrl,
        })
        .select("id,title,scheduled_at,status,notes,idea_id,thumbnail_url,created_at,updated_at")
        .single();

      if (error) {
        if (isSupabaseSchemaError(error)) {
          logSupabaseError("createScheduledVideo", error);
          return { ok: true, data: { video: createScheduledVideoCookie(payload) } };
        }
        logSupabaseError("createScheduledVideo", error);
        return calErr("DB_ERROR");
      }

      const mapped = mapRow(data);
      if (!mapped) return calErr("DB_ERROR");
      return { ok: true, data: { video: mapped } };
    },
    () => calErr("DB_ERROR"),
    "createScheduledVideo"
  );
}

export async function updateScheduledVideoAction(
  id: string,
  updates: z.infer<typeof UpdateScheduledVideoInputSchema>
): Promise<CalendarActionResult<{ video: ScheduledVideoRow }>> {
  return safeRun(
    async () => {
      const videoId = normalizeText(id);
      if (!videoId) return calErr("INVALID_INPUT");

      const parsed = UpdateScheduledVideoInputSchema.safeParse(updates);
      if (!parsed.success) return calErr("INVALID_INPUT");

      const ctx = await resolveCalendarContext();
      if (!ctx.ok) return ctx;

      const cookiePatch = {
        title: parsed.data.title,
        scheduledAt: parsed.data.scheduledAt,
        status: parsed.data.status,
        notes:
          parsed.data.notes !== undefined ? normalizeText(parsed.data.notes) ?? null : undefined,
        ideaId:
          parsed.data.ideaId !== undefined ? normalizeText(parsed.data.ideaId) ?? null : undefined,
        thumbnailUrl:
          parsed.data.thumbnailUrl !== undefined
            ? normalizeText(parsed.data.thumbnailUrl) ?? null
            : undefined,
      };

      if (ctx.data.fromCookie) {
        const hasPatch = Object.values(cookiePatch).some((value) => value !== undefined);
        if (!hasPatch) return calErr("INVALID_INPUT");

        const updated = updateScheduledVideoCookie(
          ctx.data.userId,
          ctx.data.channelId,
          videoId,
          cookiePatch
        );
        if (!updated) return calErr("NOT_FOUND");
        return { ok: true, data: { video: updated } };
      }

      const patch: Database["public"]["Tables"]["scheduled_videos"]["Update"] = {};
      if (parsed.data.title !== undefined) patch.title = parsed.data.title.trim();
      if (parsed.data.scheduledAt !== undefined) patch.scheduled_at = parsed.data.scheduledAt;
      if (parsed.data.status !== undefined) patch.status = parsed.data.status;
      if (parsed.data.notes !== undefined) patch.notes = normalizeText(parsed.data.notes) ?? null;
      if (parsed.data.ideaId !== undefined) patch.idea_id = normalizeText(parsed.data.ideaId) ?? null;
      if (parsed.data.thumbnailUrl !== undefined) {
        patch.thumbnail_url = normalizeText(parsed.data.thumbnailUrl) ?? null;
      }

      if (Object.keys(patch).length === 0) return calErr("INVALID_INPUT");

      const { data, error } = await ctx.data.supabase
        .from("scheduled_videos")
        .update(patch)
        .eq("id", videoId)
        .eq("channel_id", ctx.data.channelId)
        .select("id,title,scheduled_at,status,notes,idea_id,thumbnail_url,created_at,updated_at")
        .maybeSingle();

      if (error) {
        if (isSupabaseSchemaError(error)) {
          logSupabaseError("updateScheduledVideo", error);
          const updated = updateScheduledVideoCookie(
            ctx.data.userId,
            ctx.data.channelId,
            videoId,
            cookiePatch
          );
          if (!updated) return calErr("NOT_FOUND");
          return { ok: true, data: { video: updated } };
        }
        logSupabaseError("updateScheduledVideo", error);
        return calErr("DB_ERROR");
      }

      if (!data) return calErr("NOT_FOUND");

      const mapped = mapRow(data);
      if (!mapped) return calErr("DB_ERROR");
      return { ok: true, data: { video: mapped } };
    },
    () => calErr("DB_ERROR"),
    "updateScheduledVideo"
  );
}

export async function deleteScheduledVideoAction(
  id: string
): Promise<CalendarActionResult<{ deleted: true }>> {
  return safeRun(
    async () => {
      const videoId = normalizeText(id);
      if (!videoId) return calErr("INVALID_INPUT");

      const ctx = await resolveCalendarContext();
      if (!ctx.ok) return ctx;

      if (ctx.data.fromCookie) {
        const deleted = deleteScheduledVideoCookie(ctx.data.userId, ctx.data.channelId, videoId);
        if (!deleted) return calErr("NOT_FOUND");
        return { ok: true, data: { deleted: true } };
      }

      const { data, error } = await ctx.data.supabase
        .from("scheduled_videos")
        .delete()
        .eq("id", videoId)
        .eq("channel_id", ctx.data.channelId)
        .select("id");

      if (error) {
        if (isSupabaseSchemaError(error)) {
          logSupabaseError("deleteScheduledVideo", error);
          const deleted = deleteScheduledVideoCookie(ctx.data.userId, ctx.data.channelId, videoId);
          if (!deleted) return calErr("NOT_FOUND");
          return { ok: true, data: { deleted: true } };
        }
        logSupabaseError("deleteScheduledVideo", error);
        return calErr("DB_ERROR");
      }

      if (!data || data.length === 0) return calErr("NOT_FOUND");
      return { ok: true, data: { deleted: true } };
    },
    () => calErr("DB_ERROR"),
    "deleteScheduledVideo"
  );
}

export async function getBestPublishingTimeAction(): Promise<
  CalendarActionResult<
    | {
        recommendation: {
          weekday: number;
          hour: number;
          confidence: number;
          sampleSize: number;
        };
      }
    | { recommendation: null }
  >
> {
  try {
    const ctx = await resolveCalendarContext();
    if (!ctx.ok) {
      if (ctx.error.code === "NOT_CONNECTED" || ctx.error.code === "UNAUTHENTICATED") {
        return { ok: true, data: { recommendation: null } };
      }
      return ctx;
    }

    if (ctx.data.fromCookie) {
      const videos = await fetchChannelVideos(ctx.data.channelId, 200);
      const published = videos
        .map((v) => normalizeText(v.publishedAt))
        .filter((v): v is string => Boolean(v));
      return { ok: true, data: { recommendation: computeBestTimeRecommendation(published) } };
    }

    const { data, error } = await ctx.data.supabase
      .from("videos")
      .select("published_at")
      .eq("channel_id", ctx.data.channelId)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(200);

    if (error) {
      if (isSupabaseSchemaError(error)) {
        logSupabaseError("getBestPublishingTime", error);
        const videos = await fetchChannelVideos(ctx.data.channelId, 200);
        const published = videos
          .map((v) => normalizeText(v.publishedAt))
          .filter((v): v is string => Boolean(v));
        return { ok: true, data: { recommendation: computeBestTimeRecommendation(published) } };
      }
      logSupabaseError("getBestPublishingTime", error);
      return { ok: true, data: { recommendation: null } };
    }

    const published = (data ?? [])
      .map((r) => normalizeText((r as { published_at: string | null }).published_at))
      .filter((v): v is string => Boolean(v));

    return {
      ok: true,
      data: { recommendation: computeBestTimeRecommendation(published) },
    };
  } catch (err) {
    console.error("[server-action:getBestPublishingTime]", err);
    return { ok: true, data: { recommendation: null } };
  }
}

/** @deprecated Use getBestPublishingTimeAction */
export const getBestTimeAction = getBestPublishingTimeAction;

/** @deprecated Alias for createScheduledVideoAction */
export const scheduleVideoAction = createScheduledVideoAction;
