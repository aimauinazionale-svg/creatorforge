"use server";

import { z } from "zod";

import {
  analyzeVideoSeo,
  generateDailyInsights,
  generateScriptOutline,
  generateTitleVariants,
  generateTrendingTopics,
  generateWeeklyReport,
} from "@/lib/ai/creator-tools";
import { checkAiRateLimitFlexible } from "@/lib/ai/rate-limit";
import { requireChannel } from "@/lib/actions/auth-context";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/result";
import { safeAction } from "@/lib/actions/safe";
import { getChannelConnectionCookie } from "@/lib/youtube/connection-store";
import {
  fetchChannelVideos,
  fetchVideoDetails,
  searchNicheTrending,
} from "@/lib/youtube/api";
import { parseVideoInput } from "@/lib/youtube/parse-video";

const LocaleSchema = z.enum(["en", "it", "es", "de", "fr", "pt", "ru", "ja", "zh"]);

function titleFromChannelData(channelData: unknown): string {
  const data = (channelData ?? {}) as Record<string, unknown>;
  return typeof data.title === "string" ? data.title : "Your channel";
}

async function guardAiRateLimit(): Promise<ActionResult<void>> {
  const limit = await checkAiRateLimitFlexible();
  if (!limit.ok && limit.error.code === "RATE_LIMITED") {
    return actionErr("RATE_LIMITED");
  }
  return actionOk(undefined);
}

function mapAiError(code: string, details?: string): ActionResult<never> {
  switch (code) {
    case "RATE_LIMITED":
      return actionErr("RATE_LIMITED");
    case "MISSING_CONFIG":
      return actionErr("MISSING_CONFIG", details);
    default:
      return actionErr("PROVIDER_ERROR", details);
  }
}

export async function getDashboardInsightsAction(input: {
  locale: z.infer<typeof LocaleSchema>;
}): Promise<
  ActionResult<{
    dailyTip: string;
    focusArea: string;
    actionItems: string[];
    bestVideoHint: string;
    topVideo: { title: string; views: number } | null;
  }>
> {
  return safeAction(async () => {
    const localeParsed = LocaleSchema.safeParse(input.locale);
    if (!localeParsed.success) return actionErr("INVALID_INPUT");

    const rateCheck = await guardAiRateLimit();
    if (!rateCheck.ok) return rateCheck;

    const ctx = await requireChannel();
    let channelName = "Your channel";
    let subscriberCount = 0;
    let videoCount = 0;
    let youtubeChannelId: string | null = null;

    if (ctx.ok) {
      youtubeChannelId = ctx.data.youtubeChannelId;
      if (ctx.data.fromCookie) {
        const cookie = getChannelConnectionCookie();
        if (cookie) {
          channelName = cookie.channelTitle;
          subscriberCount = cookie.subscriberCount;
          videoCount = cookie.videoCount;
        }
      } else {
        const { data: channel } = await ctx.data.supabase
          .from("channels")
          .select("channel_data, stats_cache")
          .eq("id", ctx.data.channelId)
          .single();
        const stats = (channel?.stats_cache ?? {}) as Record<string, number>;
        channelName = titleFromChannelData(channel?.channel_data);
        subscriberCount = Number(stats.subscriberCount ?? 0);
        videoCount = Number(stats.videoCount ?? 0);
      }
    } else {
      const cookie = getChannelConnectionCookie();
      if (!cookie) return actionErr("YOUTUBE_NOT_CONNECTED");
      channelName = cookie.channelTitle;
      subscriberCount = cookie.subscriberCount;
      videoCount = cookie.videoCount;
      youtubeChannelId = cookie.youtubeChannelId;
    }

    const videos = youtubeChannelId ? await fetchChannelVideos(youtubeChannelId, 10) : [];
    const topVideo = videos.length
      ? videos.reduce((best, v) => (v.viewCount > best.viewCount ? v : best), videos[0])
      : null;

    const ai = await generateDailyInsights({
      channelName,
      subscriberCount,
      videoCount,
      topVideoTitle: topVideo?.title ?? null,
      topVideoViews: topVideo?.viewCount ?? 0,
      locale: localeParsed.data,
    });

    if (!ai.ok) return mapAiError(ai.error.code, ai.error.details);

    return actionOk({
      ...ai.data,
      topVideo: topVideo ? { title: topVideo.title, views: topVideo.viewCount } : null,
    });
  }, "getDashboardInsights");
}

export async function getTrendingTopicsAction(input: {
  niche?: string;
  locale: z.infer<typeof LocaleSchema>;
}): Promise<
  ActionResult<{
    topics: Array<{ title: string; keyword: string; trendScore: number; summary: string }>;
    niche: string;
  }>
> {
  return safeAction(async () => {
    const localeParsed = LocaleSchema.safeParse(input.locale);
    if (!localeParsed.success) return actionErr("INVALID_INPUT");

    const rateCheck = await guardAiRateLimit();
    if (!rateCheck.ok) return rateCheck;

    let niche = input.niche?.trim() ?? "";
    const ctx = await requireChannel();

    if (!niche) {
      if (ctx.ok) {
        if (ctx.data.fromCookie) {
          const cookie = getChannelConnectionCookie();
          niche = cookie?.channelTitle ?? "YouTube";
        } else {
          const { data: channel } = await ctx.data.supabase
            .from("channels")
            .select("channel_data")
            .eq("id", ctx.data.channelId)
            .single();
          niche = titleFromChannelData(channel?.channel_data);
        }
      } else {
        const cookie = getChannelConnectionCookie();
        niche = cookie?.channelTitle ?? "YouTube creator";
      }
    }

    const trendingVideos = await searchNicheTrending(niche, 8);
    const ai = await generateTrendingTopics(
      niche,
      trendingVideos.map((v) => ({ title: v.title, views: v.viewCount, channel: v.channelTitle })),
      localeParsed.data
    );

    if (!ai.ok) return mapAiError(ai.error.code, ai.error.details);

    return actionOk({ topics: ai.data, niche });
  }, "getTrendingTopics");
}

export async function getWeeklyReportPreviewAction(input: {
  locale: z.infer<typeof LocaleSchema>;
}): Promise<
  ActionResult<{
    headline: string;
    growthSummary: string;
    highlights: string[];
    improvements: string[];
    nextWeekGoals: string[];
    estimatedGrowth: string;
    channelName: string;
    stats: { subscribers: number; views: number; videos: number };
  }>
> {
  return safeAction(async () => {
    const localeParsed = LocaleSchema.safeParse(input.locale);
    if (!localeParsed.success) return actionErr("INVALID_INPUT");

    const rateCheck = await guardAiRateLimit();
    if (!rateCheck.ok) return rateCheck;

    const ctx = await requireChannel();
    let channelName = "Your channel";
    let subscriberCount = 0;
    let viewCount = 0;
    let videoCount = 0;
    let youtubeChannelId: string | null = null;

    if (ctx.ok) {
      youtubeChannelId = ctx.data.youtubeChannelId;
      if (ctx.data.fromCookie) {
        const cookie = getChannelConnectionCookie();
        if (cookie) {
          channelName = cookie.channelTitle;
          subscriberCount = cookie.subscriberCount;
          viewCount = cookie.viewCount;
          videoCount = cookie.videoCount;
        }
      } else {
        const { data: channel } = await ctx.data.supabase
          .from("channels")
          .select("channel_data, stats_cache")
          .eq("id", ctx.data.channelId)
          .single();
        const stats = (channel?.stats_cache ?? {}) as Record<string, number>;
        channelName = titleFromChannelData(channel?.channel_data);
        subscriberCount = Number(stats.subscriberCount ?? 0);
        viewCount = Number(stats.viewCount ?? 0);
        videoCount = Number(stats.videoCount ?? 0);
      }
    } else {
      const cookie = getChannelConnectionCookie();
      if (!cookie) return actionErr("YOUTUBE_NOT_CONNECTED");
      channelName = cookie.channelTitle;
      subscriberCount = cookie.subscriberCount;
      viewCount = cookie.viewCount;
      videoCount = cookie.videoCount;
      youtubeChannelId = cookie.youtubeChannelId;
    }

    const videos = youtubeChannelId ? await fetchChannelVideos(youtubeChannelId, 5) : [];
    const ai = await generateWeeklyReport({
      channelName,
      subscriberCount,
      viewCount,
      videoCount,
      recentVideos: videos.map((v) => ({ title: v.title, views: v.viewCount })),
      locale: localeParsed.data,
    });

    if (!ai.ok) return mapAiError(ai.error.code, ai.error.details);

    return actionOk({
      ...ai.data,
      channelName,
      stats: { subscribers: subscriberCount, views: viewCount, videos: videoCount },
    });
  }, "getWeeklyReportPreview");
}

const AnalyzeVideoSchema = z.object({
  videoInput: z.string().min(6).max(500),
});

export async function analyzeVideoSeoAction(
  input: z.infer<typeof AnalyzeVideoSchema>
): Promise<
  ActionResult<{
    video: {
      title: string;
      description: string;
      tags: string[];
      viewCount: number;
      likeCount: number;
      thumbnailUrl: string | null;
    };
    analysis: {
      overallScore: number;
      titleScore: number;
      descriptionScore: number;
      tagsScore: number;
      suggestedTitle: string;
      suggestedDescription: string;
      suggestedTags: string[];
      improvements: Array<{ area: string; issue: string; fix: string }>;
    };
  }>
> {
  return safeAction(async () => {
    const parsed = AnalyzeVideoSchema.safeParse(input);
    if (!parsed.success) return actionErr("INVALID_INPUT");

    const rateCheck = await guardAiRateLimit();
    if (!rateCheck.ok) return rateCheck;

    const videoId = parseVideoInput(parsed.data.videoInput);
    if (!videoId) return actionErr("INVALID_INPUT", "Invalid YouTube video URL or ID");

    const details = await fetchVideoDetails(videoId);
    if (!details) return actionErr("NOT_FOUND", "Video not found or YouTube API unavailable");

    const ai = await analyzeVideoSeo({
      title: details.title,
      description: details.description,
      tags: details.tags,
      viewCount: details.viewCount,
      likeCount: details.likeCount,
    });

    if (!ai.ok) return mapAiError(ai.error.code, ai.error.details);

    return actionOk({
      video: {
        title: details.title,
        description: details.description,
        tags: details.tags,
        viewCount: details.viewCount,
        likeCount: details.likeCount,
        thumbnailUrl: details.thumbnailUrl,
      },
      analysis: ai.data,
    });
  }, "analyzeVideoSeo");
}

const TitleVariantsSchema = z.object({
  title: z.string().min(2).max(200),
  topic: z.string().min(2).max(200),
  includeEmoji: z.boolean().default(false),
  powerWords: z.boolean().default(true),
});

export async function generateTitleVariantsAction(
  input: z.infer<typeof TitleVariantsSchema>
): Promise<
  ActionResult<{
    variants: Array<{
      title: string;
      ctrHook: string;
      predictedScore: number;
      lengthChars: number;
      usesEmoji: boolean;
      powerWords: string[];
    }>;
  }>
> {
  return safeAction(async () => {
    const parsed = TitleVariantsSchema.safeParse(input);
    if (!parsed.success) return actionErr("INVALID_INPUT");

    const rateCheck = await guardAiRateLimit();
    if (!rateCheck.ok) return rateCheck;

    const ai = await generateTitleVariants(parsed.data.title, parsed.data.topic, {
      includeEmoji: parsed.data.includeEmoji,
      powerWords: parsed.data.powerWords,
      count: 5,
    });

    if (!ai.ok) return mapAiError(ai.error.code, ai.error.details);

    return actionOk({ variants: ai.data });
  }, "generateTitleVariants");
}

const ScriptOutlineInputSchema = z.object({
  title: z.string().min(2).max(200),
  duration: z.string().min(2).max(50).default("8-10 minutes"),
  style: z.string().min(2).max(100).default("educational"),
});

export async function generateScriptOutlineAction(
  input: z.infer<typeof ScriptOutlineInputSchema>
): Promise<
  ActionResult<{
    hook: string;
    intro: string;
    sections: Array<{ sectionTitle: string; timeRange: string; bullets: string[] }>;
    cta: string;
    outro: string;
  }>
> {
  return safeAction(async () => {
    const parsed = ScriptOutlineInputSchema.safeParse(input);
    if (!parsed.success) return actionErr("INVALID_INPUT");

    const rateCheck = await guardAiRateLimit();
    if (!rateCheck.ok) return rateCheck;

    const ai = await generateScriptOutline(
      parsed.data.title,
      parsed.data.duration,
      parsed.data.style
    );

    if (!ai.ok) return mapAiError(ai.error.code, ai.error.details);

    return actionOk(ai.data);
  }, "generateScriptOutline");
}
