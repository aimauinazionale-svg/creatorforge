export const SCHEDULED_VIDEO_STATUSES = [
  "planned",
  "draft",
  "scheduled",
  "published",
  "canceled",
] as const;

export type ScheduledVideoStatus = (typeof SCHEDULED_VIDEO_STATUSES)[number];

export type CalendarActionErrorCode =
  | "UNAUTHENTICATED"
  | "NOT_CONNECTED"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "DATABASE_NOT_READY"
  | "DB_ERROR";

export type CalendarActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: CalendarActionErrorCode; details?: string } };

export type ScheduledVideoRow = {
  id: string;
  title: string;
  scheduledAt: string;
  status: ScheduledVideoStatus;
  notes: string | null;
  ideaId: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
};
