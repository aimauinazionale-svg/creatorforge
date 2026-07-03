/**
 * Tutorial catalog — add YouTube video IDs here after recording.
 * Titles and descriptions live in messages/{locale}.json under tutorials.items.{id}.
 */
export type TutorialCategoryId =
  | "gettingStarted"
  | "aiTools"
  | "youtubeConnect"
  | "dashboard"
  | "proFeatures"
  | "tipsTricks";

export type Tutorial = {
  id: string;
  categoryId: TutorialCategoryId;
  /** Estimated duration shown on cards (minutes). */
  durationMinutes: number;
  /** YouTube video ID (e.g. "dQw4w9WgXcQ"). Omit or leave empty until recorded. */
  youtubeVideoId?: string;
};

export const TUTORIAL_CATEGORIES: readonly TutorialCategoryId[] = [
  "gettingStarted",
  "aiTools",
  "youtubeConnect",
  "dashboard",
  "proFeatures",
  "tipsTricks",
] as const;

export const TUTORIALS: readonly Tutorial[] = [
  // Getting Started
  { id: "welcome", categoryId: "gettingStarted", durationMinutes: 3 },
  { id: "create-account", categoryId: "gettingStarted", durationMinutes: 4 },
  // AI Tools
  { id: "ai-assistant", categoryId: "aiTools", durationMinutes: 6 },
  { id: "ideas-generator", categoryId: "aiTools", durationMinutes: 5 },
  { id: "seo-lab-basics", categoryId: "aiTools", durationMinutes: 7 },
  // YouTube Connect
  { id: "connect-youtube", categoryId: "youtubeConnect", durationMinutes: 4 },
  { id: "oauth-permissions", categoryId: "youtubeConnect", durationMinutes: 3 },
  // Dashboard
  { id: "dashboard-overview", categoryId: "dashboard", durationMinutes: 5 },
  { id: "channel-health", categoryId: "dashboard", durationMinutes: 4 },
  // Pro Features
  { id: "upgrade-pro", categoryId: "proFeatures", durationMinutes: 3 },
  { id: "pro-features-tour", categoryId: "proFeatures", durationMinutes: 6 },
  // Tips & Tricks
  { id: "workflow-tips", categoryId: "tipsTricks", durationMinutes: 5 },
  { id: "productivity-shortcuts", categoryId: "tipsTricks", durationMinutes: 4 },
] as const;

export function getTutorialsByCategory(categoryId: TutorialCategoryId): Tutorial[] {
  return TUTORIALS.filter((t) => t.categoryId === categoryId);
}
