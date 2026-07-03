import type { ScheduledVideoStatus } from "@/lib/actions/types/calendar";

export type { ScheduledVideoStatus };

export type CalendarViewMode = "month" | "week" | "list";

export type ScheduledVideo = {
  id: string;
  title: string;
  scheduledAt: string; // ISO
  status: ScheduledVideoStatus;
  notes: string | null;
  ideaId: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BestPublishingTimeRecommendation = {
  weekday: number; // 0=Sun
  hour: number;
  confidence: number;
  sampleSize: number;
};

