import fs from "node:fs";
import path from "node:path";

const root = path.resolve("messages");
const locales = ["en", "it", "es", "de", "fr", "pt", "ru", "ja", "zh"];

const topLevelEn = {
  common: {
    errors: {
      UNAUTHENTICATED: "Please sign in to continue.",
      RATE_LIMITED: "You reached today's limit. Try again tomorrow.",
      YOUTUBE_NOT_CONNECTED: "Connect your YouTube channel to use this feature.",
      NOT_CONNECTED: "Connect your YouTube channel to use this feature.",
      INVALID_INPUT: "Invalid input. Please check and try again.",
      NOT_FOUND: "This item no longer exists.",
      DB_ERROR: "We couldn't save your changes. {details}",
      NETWORK: "Network error. Check your connection and try again.",
      UNKNOWN: "Something went wrong. Please try again.",
      AUTH_ERROR: "Authentication failed. Please try again.",
      MISSING_CONFIG: "Missing configuration. {details}",
      TIMEOUT: "The request timed out. Please try again.",
      INVALID_JSON: "The response could not be parsed. Please try again.",
    },
    actions: {
      signIn: "Sign in",
      connectYouTube: "Connect YouTube",
      retry: "Try again",
      copy: "Copy",
      copied: "Copied!",
    },
    toast: { success: "Done", error: "Something went wrong" },
    loading: "Loading…",
  },
  notFound: {
    title: "Page not found",
    description: "The page you're looking for doesn't exist or was moved.",
    backHome: "Back to dashboard",
  },
  errors: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Try refreshing the page.",
    retry: "Try again",
  },
  devBanner: {
    message:
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    dismiss: "Dismiss",
  },
  login: {
    pageTitle: "Sign in to CreatorForge",
    pageSubtitle: "Use Google or a magic link to access your creator toolkit.",
    title: "Welcome back",
    subtitle: "Choose how you'd like to sign in.",
    google: "Continue with Google",
    orEmail: "Or continue with email",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    magicLink: "Send magic link",
    checkInbox: "Check your inbox for a sign-in link.",
    validation: { email: "Please enter a valid email address." },
    toast: { magicLinkSent: "Magic link sent. Check your email.", error: "Sign-in failed" },
    errors: { AUTH_ERROR: "We couldn't sign you in. Please try again." },
  },
  search: {
    placeholder: "Search ideas & workflows…",
    aria: "Global search",
    empty: "No results found.",
    resultsAria: "Search results",
    types: { idea: "Idea", workflow: "Workflow" },
  },
};

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof target[key] === "object" &&
      target[key] &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], value);
    } else if (!(key in target)) {
      target[key] = value;
    }
  }
}

for (const locale of locales) {
  const file = path.join(root, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  deepMerge(data, topLevelEn);

  const dashboard = data.dashboard ?? {};
  dashboard.recentActivity ??= {
    title: "Recent activity",
    empty: "No recent activity yet.",
    types: { idea: "Idea saved", workflow: "Workflow", scheduled: "Scheduled video", ai: "AI request" },
  };
  dashboard.channelHealth ??= {
    title: "Channel health",
    labels: { excellent: "Excellent", good: "Good", fair: "Fair", needs_attention: "Needs attention" },
    factors: {
      channelConnected: "YouTube channel connected",
      hasIdeas: "Ideas in Idea Bank",
      activeWorkflow: "Active workflows",
      scheduledContent: "Scheduled content",
      syncedVideos: "Synced videos",
      tracksCompetitors: "Competitors tracked",
    },
  };
  data.dashboard = dashboard;

  const ideas = data.ideas ?? {};
  const actions = ideas.actions ?? {};
  actions.exportJson ??= "Export JSON";
  actions.createWorkflow ??= "Create workflow";
  actions.viewWorkflow ??= "View workflow";
  ideas.actions = actions;
  const toast = ideas.toast ?? {};
  toast.exported ??= { title: "Exported", description: "Ideas downloaded as JSON." };
  toast.workflowCreated ??= {
    title: "Workflow created",
    description: "Your idea is now a workflow project.",
  };
  ideas.toast = toast;
  data.ideas = ideas;

  const competitors = data.competitors ?? {};
  competitors.contentGap ??= {
    title: "Content gap hint",
    description: "Competitors cover these topics more than you. These could be opportunities:",
  };
  data.competitors = competitors;

  const aiAssistant = data.aiAssistant ?? {};
  aiAssistant.toast ??= { success: "Ideas generated", error: "Generation failed" };
  data.aiAssistant = aiAssistant;

  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`patched ${locale}`);
}
