import {
  SCHEDULED_VIDEO_STATUSES,
  type ScheduledVideoRow,
  type ScheduledVideoStatus,
} from "@/lib/actions/types/calendar";
import { readCookieJson, writeCookieJson } from "@/lib/storage/cookie-store";

const PREFIX = "cf_calendar_";
export const CALENDAR_COOKIE_LIMIT = 200;

type ScheduledVideoCookieEntry = ScheduledVideoRow & {
  userId: string;
  channelId: string;
};

function cookieKey(actorId: string): string {
  return `${PREFIX}${actorId}`;
}

function isValidStatus(value: string): value is ScheduledVideoStatus {
  return (SCHEDULED_VIDEO_STATUSES as readonly string[]).includes(value);
}

function readEntries(actorId: string): ScheduledVideoCookieEntry[] {
  const items = readCookieJson<ScheduledVideoCookieEntry[]>(cookieKey(actorId), []);
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => {
      if (!item || typeof item !== "object") return false;
      return (
        typeof item.id === "string" &&
        typeof item.userId === "string" &&
        typeof item.channelId === "string" &&
        typeof item.title === "string" &&
        typeof item.scheduledAt === "string" &&
        typeof item.status === "string" &&
        isValidStatus(item.status)
      );
    })
    .slice(0, CALENDAR_COOKIE_LIMIT);
}

function writeEntries(actorId: string, entries: ScheduledVideoCookieEntry[]): void {
  writeCookieJson(cookieKey(actorId), entries.slice(0, CALENDAR_COOKIE_LIMIT));
}

function toRow(entry: ScheduledVideoCookieEntry): ScheduledVideoRow {
  return {
    id: entry.id,
    title: entry.title,
    scheduledAt: entry.scheduledAt,
    status: entry.status,
    notes: entry.notes,
    ideaId: entry.ideaId,
    thumbnailUrl: entry.thumbnailUrl,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

/** Lists scheduled videos for an actor/channel within a date range (cookie fallback). */
export function listScheduledVideosCookie(
  userId: string,
  channelId: string,
  startIso: string,
  endIso: string
): ScheduledVideoRow[] {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return [];

  return readEntries(userId)
    .filter((entry) => entry.userId === userId && entry.channelId === channelId)
    .filter((entry) => {
      const at = new Date(entry.scheduledAt).getTime();
      return !Number.isNaN(at) && at >= start && at < end;
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .map(toRow);
}

export type CreateScheduledVideoCookieInput = {
  userId: string;
  channelId: string;
  title: string;
  scheduledAt: string;
  status?: ScheduledVideoStatus;
  notes?: string | null;
  ideaId?: string | null;
  thumbnailUrl?: string | null;
};

/** Creates a scheduled video in cookie storage. */
export function createScheduledVideoCookie(
  input: CreateScheduledVideoCookieInput
): ScheduledVideoRow {
  const now = new Date().toISOString();
  const entry: ScheduledVideoCookieEntry = {
    id: crypto.randomUUID(),
    userId: input.userId,
    channelId: input.channelId,
    title: input.title.trim(),
    scheduledAt: input.scheduledAt,
    status: input.status ?? "planned",
    notes: input.notes ?? null,
    ideaId: input.ideaId ?? null,
    thumbnailUrl: input.thumbnailUrl ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const existing = readEntries(input.userId);
  writeEntries(input.userId, [...existing, entry]);
  return toRow(entry);
}

export type UpdateScheduledVideoCookieInput = {
  title?: string;
  scheduledAt?: string;
  status?: ScheduledVideoStatus;
  notes?: string | null;
  ideaId?: string | null;
  thumbnailUrl?: string | null;
};

/** Updates a scheduled video in cookie storage. */
export function updateScheduledVideoCookie(
  userId: string,
  channelId: string,
  id: string,
  updates: UpdateScheduledVideoCookieInput
): ScheduledVideoRow | null {
  const existing = readEntries(userId);
  const index = existing.findIndex(
    (entry) => entry.id === id && entry.userId === userId && entry.channelId === channelId
  );
  if (index < 0) return null;

  const current = existing[index];
  const updated: ScheduledVideoCookieEntry = {
    ...current,
    ...updates,
    title: updates.title !== undefined ? updates.title.trim() : current.title,
    notes: updates.notes !== undefined ? updates.notes : current.notes,
    ideaId: updates.ideaId !== undefined ? updates.ideaId : current.ideaId,
    thumbnailUrl: updates.thumbnailUrl !== undefined ? updates.thumbnailUrl : current.thumbnailUrl,
    updatedAt: new Date().toISOString(),
  };

  const next = [...existing];
  next[index] = updated;
  writeEntries(userId, next);
  return toRow(updated);
}

/** Deletes a scheduled video from cookie storage. */
export function deleteScheduledVideoCookie(
  userId: string,
  channelId: string,
  id: string
): boolean {
  const existing = readEntries(userId);
  const next = existing.filter(
    (entry) => !(entry.id === id && entry.userId === userId && entry.channelId === channelId)
  );
  if (next.length === existing.length) return false;
  writeEntries(userId, next);
  return true;
}
