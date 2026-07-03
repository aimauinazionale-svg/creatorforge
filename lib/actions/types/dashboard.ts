import type { YouTubeVideoSummary } from "@/lib/youtube/api";

export type DashboardActivity = {
  id: string;
  type: "video" | "idea" | "workflow";
  title: string;
  timestamp: string;
};

export type ActivityItem = {
  id: string;
  type: "video" | "idea" | "workflow" | "scheduled" | "ai";
  title: string;
  at: string;
};

export type ChannelHealth = {
  score: number;
  label: "excellent" | "good" | "fair" | "needs_attention";
  factors: Array<{ key: string; met: boolean }>;
};

export type DashboardData = {
  healthScore: number;
  healthLabel: ChannelHealth["label"];
  recentVideos: YouTubeVideoSummary[];
  recentActivity: DashboardActivity[];
};
