import { z } from "zod";

import { generateCompletion } from "@/lib/ai/groq";
import {
  analyzeVideoSeoPrompt,
  dailyInsightsPrompt,
  generateScriptOutlinePrompt,
  titleVariantsPrompt,
  trendingTopicsPrompt,
  weeklyReportPrompt,
} from "@/lib/ai/prompts";
import { incrementAiRequestFlexible } from "@/lib/ai/rate-limit";

function extractLikelyJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) return candidate.slice(firstBrace, lastBrace + 1);
  return candidate;
}

type AiError = { code: "RATE_LIMITED" | "MISSING_CONFIG" | "PROVIDER_ERROR" | "INVALID_JSON"; details?: string };

const DailyInsightsSchema = z.object({
  dailyTip: z.string(),
  focusArea: z.string(),
  actionItems: z.array(z.string()).min(1).max(5),
  bestVideoHint: z.string(),
});

export type DailyInsights = z.infer<typeof DailyInsightsSchema>;

export async function generateDailyInsights(
  context: {
    channelName: string;
    subscriberCount: number;
    videoCount: number;
    topVideoTitle: string | null;
    topVideoViews: number;
    locale: string;
  }
): Promise<{ ok: true; data: DailyInsights } | { ok: false; error: AiError }> {
  const prompt = dailyInsightsPrompt(context);
  const completion = await generateCompletion(
    [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    { temperature: 0.7 }
  );

  if (!completion.ok) {
    if (completion.error.code === "RATE_LIMITED") return { ok: false, error: { code: "RATE_LIMITED" } };
    if (completion.error.code === "MISSING_CONFIG") return { ok: false, error: { code: "MISSING_CONFIG" } };
    return { ok: false, error: { code: "PROVIDER_ERROR", details: completion.error.details } };
  }

  try {
    const parsed = DailyInsightsSchema.safeParse(JSON.parse(extractLikelyJson(completion.data.content)));
    if (!parsed.success) {
      return {
        ok: true,
        data: {
          dailyTip: "Focus on one high-impact task today: optimize your most recent video's title and thumbnail.",
          focusArea: "SEO",
          actionItems: [
            "Review and update your latest video title",
            "Schedule your next upload in the calendar",
            "Research 3 keywords in SEO Lab",
          ],
          bestVideoHint: context.topVideoTitle
            ? `"${context.topVideoTitle}" is your top performer — analyze what made it work.`
            : "Publish consistently to build momentum.",
        },
      };
    }
    await incrementAiRequestFlexible("daily_insights");
    return { ok: true, data: parsed.data };
  } catch (err) {
    return { ok: false, error: { code: "INVALID_JSON", details: err instanceof Error ? err.message : undefined } };
  }
}

const TrendingTopicSchema = z.object({
  title: z.string(),
  keyword: z.string(),
  trendScore: z.number().min(0).max(100),
  summary: z.string(),
});

const TrendingTopicsSchema = z.object({
  topics: z.array(TrendingTopicSchema).min(1).max(6),
});

export type TrendingTopic = z.infer<typeof TrendingTopicSchema>;

export async function generateTrendingTopics(
  niche: string,
  videos: Array<{ title: string; views: number; channel: string }>,
  locale: string
): Promise<{ ok: true; data: TrendingTopic[] } | { ok: false; error: AiError }> {
  const prompt = trendingTopicsPrompt(niche, videos, locale);
  const completion = await generateCompletion(
    [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    { temperature: 0.6 }
  );

  if (!completion.ok) {
    if (completion.error.code === "RATE_LIMITED") return { ok: false, error: { code: "RATE_LIMITED" } };
    if (completion.error.code === "MISSING_CONFIG") return { ok: false, error: { code: "MISSING_CONFIG" } };
    return { ok: false, error: { code: "PROVIDER_ERROR", details: completion.error.details } };
  }

  try {
    const parsed = TrendingTopicsSchema.safeParse(JSON.parse(extractLikelyJson(completion.data.content)));
    if (!parsed.success) {
      const fallback = videos.slice(0, 3).map((v) => ({
        title: v.title.slice(0, 80),
        keyword: niche,
        trendScore: Math.min(90, 50 + Math.floor(v.views / 10000)),
        summary: `Trending on ${v.channel} with strong view count.`,
      }));
      return { ok: true, data: fallback.length ? fallback : [{ title: `${niche} tips`, keyword: niche, trendScore: 70, summary: "Popular topic in your niche." }] };
    }
    await incrementAiRequestFlexible("trending_topics");
    return { ok: true, data: parsed.data.topics };
  } catch (err) {
    return { ok: false, error: { code: "INVALID_JSON", details: err instanceof Error ? err.message : undefined } };
  }
}

const WeeklyReportSchema = z.object({
  headline: z.string(),
  growthSummary: z.string(),
  highlights: z.array(z.string()).min(1),
  improvements: z.array(z.string()).min(1),
  nextWeekGoals: z.array(z.string()).min(1),
  estimatedGrowth: z.string(),
});

export type WeeklyReport = z.infer<typeof WeeklyReportSchema>;

export async function generateWeeklyReport(context: {
  channelName: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  recentVideos: Array<{ title: string; views: number }>;
  locale: string;
}): Promise<{ ok: true; data: WeeklyReport } | { ok: false; error: AiError }> {
  const prompt = weeklyReportPrompt(context);
  const completion = await generateCompletion(
    [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    { temperature: 0.6 }
  );

  if (!completion.ok) {
    if (completion.error.code === "RATE_LIMITED") return { ok: false, error: { code: "RATE_LIMITED" } };
    if (completion.error.code === "MISSING_CONFIG") return { ok: false, error: { code: "MISSING_CONFIG" } };
    return { ok: false, error: { code: "PROVIDER_ERROR", details: completion.error.details } };
  }

  try {
    const parsed = WeeklyReportSchema.safeParse(JSON.parse(extractLikelyJson(completion.data.content)));
    if (!parsed.success) {
      return {
        ok: true,
        data: {
          headline: `Weekly snapshot for ${context.channelName}`,
          growthSummary: `Your channel has ${context.subscriberCount.toLocaleString()} subscribers and ${context.viewCount.toLocaleString()} total views.`,
          highlights: ["Channel connected and tracking", "Content library growing"],
          improvements: ["Increase upload frequency", "Optimize titles with SEO Lab"],
          nextWeekGoals: ["Publish 1 video", "Research 5 keywords", "Update 1 thumbnail"],
          estimatedGrowth: "Steady growth with consistent uploads.",
        },
      };
    }
    await incrementAiRequestFlexible("weekly_report");
    return { ok: true, data: parsed.data };
  } catch (err) {
    return { ok: false, error: { code: "INVALID_JSON", details: err instanceof Error ? err.message : undefined } };
  }
}

const ScriptOutlineSchema = z.object({
  hook: z.string(),
  intro: z.string(),
  sections: z.array(
    z.object({
      sectionTitle: z.string(),
      timeRange: z.string(),
      bullets: z.array(z.string()),
    })
  ),
  cta: z.string(),
  outro: z.string(),
});

export type ScriptOutline = z.infer<typeof ScriptOutlineSchema>;

export async function generateScriptOutline(
  title: string,
  duration: string,
  style: string
): Promise<{ ok: true; data: ScriptOutline } | { ok: false; error: AiError }> {
  const prompt = generateScriptOutlinePrompt(title, duration, style);
  const completion = await generateCompletion(
    [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    { temperature: 0.7 }
  );

  if (!completion.ok) {
    if (completion.error.code === "RATE_LIMITED") return { ok: false, error: { code: "RATE_LIMITED" } };
    if (completion.error.code === "MISSING_CONFIG") return { ok: false, error: { code: "MISSING_CONFIG" } };
    return { ok: false, error: { code: "PROVIDER_ERROR", details: completion.error.details } };
  }

  try {
    const parsed = ScriptOutlineSchema.safeParse(JSON.parse(extractLikelyJson(completion.data.content)));
    if (!parsed.success) {
      return {
        ok: true,
        data: {
          hook: `Did you know this about ${title}?`,
          intro: `Welcome back! Today we're diving into ${title}.`,
          sections: [
            { sectionTitle: "Problem setup", timeRange: "0:00-1:00", bullets: ["Introduce the topic", "Explain why it matters"] },
            { sectionTitle: "Main content", timeRange: "1:00-5:00", bullets: ["Key point 1", "Key point 2", "Key point 3"] },
            { sectionTitle: "Examples", timeRange: "5:00-7:00", bullets: ["Real-world example", "Common mistakes"] },
          ],
          cta: "Subscribe and hit the bell for more content like this!",
          outro: "Thanks for watching — see you in the next one!",
        },
      };
    }
    await incrementAiRequestFlexible("script_outline");
    return { ok: true, data: parsed.data };
  } catch (err) {
    return { ok: false, error: { code: "INVALID_JSON", details: err instanceof Error ? err.message : undefined } };
  }
}

const TitleVariantSchema = z.object({
  title: z.string(),
  ctrHook: z.string(),
  predictedScore: z.number().min(0).max(100),
  lengthChars: z.number(),
  usesEmoji: z.boolean(),
  powerWords: z.array(z.string()),
});

export type TitleVariant = z.infer<typeof TitleVariantSchema>;

export async function generateTitleVariants(
  title: string,
  topic: string,
  options: { includeEmoji: boolean; powerWords: boolean; count: number }
): Promise<{ ok: true; data: TitleVariant[] } | { ok: false; error: AiError }> {
  const prompt = titleVariantsPrompt(title, topic, options);
  const completion = await generateCompletion(
    [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    { temperature: 0.8 }
  );

  if (!completion.ok) {
    if (completion.error.code === "RATE_LIMITED") return { ok: false, error: { code: "RATE_LIMITED" } };
    if (completion.error.code === "MISSING_CONFIG") return { ok: false, error: { code: "MISSING_CONFIG" } };
    return { ok: false, error: { code: "PROVIDER_ERROR", details: completion.error.details } };
  }

  try {
    const json = JSON.parse(extractLikelyJson(completion.data.content)) as { variants?: unknown[] };
    const variants = (json.variants ?? []).map((v) => TitleVariantSchema.safeParse(v)).filter((r) => r.success).map((r) => r.data);
    if (!variants.length) {
      return {
        ok: true,
        data: [
          { title: title.slice(0, 90), ctrHook: "Direct clarity", predictedScore: 72, lengthChars: title.length, usesEmoji: false, powerWords: [] },
          { title: `How to ${topic} (Complete Guide)`.slice(0, 90), ctrHook: "Completeness", predictedScore: 78, lengthChars: 30, usesEmoji: false, powerWords: ["Complete"] },
        ],
      };
    }
    await incrementAiRequestFlexible("title_variants");
    return { ok: true, data: variants };
  } catch (err) {
    return { ok: false, error: { code: "INVALID_JSON", details: err instanceof Error ? err.message : undefined } };
  }
}

const VideoSeoAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  titleScore: z.number().min(0).max(100),
  descriptionScore: z.number().min(0).max(100),
  tagsScore: z.number().min(0).max(100),
  suggestedTitle: z.string(),
  suggestedDescription: z.string(),
  suggestedTags: z.array(z.string()),
  improvements: z.array(
    z.object({
      area: z.string(),
      issue: z.string(),
      fix: z.string(),
    })
  ),
});

export type VideoSeoAnalysis = z.infer<typeof VideoSeoAnalysisSchema>;

export async function analyzeVideoSeo(video: {
  title: string;
  description: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
}): Promise<{ ok: true; data: VideoSeoAnalysis } | { ok: false; error: AiError }> {
  const prompt = analyzeVideoSeoPrompt(video);
  const completion = await generateCompletion(
    [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    { temperature: 0.5 }
  );

  if (!completion.ok) {
    if (completion.error.code === "RATE_LIMITED") return { ok: false, error: { code: "RATE_LIMITED" } };
    if (completion.error.code === "MISSING_CONFIG") return { ok: false, error: { code: "MISSING_CONFIG" } };
    return { ok: false, error: { code: "PROVIDER_ERROR", details: completion.error.details } };
  }

  try {
    const parsed = VideoSeoAnalysisSchema.safeParse(JSON.parse(extractLikelyJson(completion.data.content)));
    if (!parsed.success) {
      const titleLen = video.title.length;
      const titleScore = titleLen >= 40 && titleLen <= 70 ? 80 : 60;
      const descScore = video.description.length > 200 ? 75 : 50;
      const tagsScore = video.tags.length >= 10 ? 80 : 55;
      return {
        ok: true,
        data: {
          overallScore: Math.round((titleScore + descScore + tagsScore) / 3),
          titleScore,
          descriptionScore: descScore,
          tagsScore,
          suggestedTitle: video.title,
          suggestedDescription: video.description.slice(0, 200),
          suggestedTags: video.tags.slice(0, 15),
          improvements: [
            { area: "title", issue: "Title length", fix: "Aim for 40-70 characters." },
            { area: "description", issue: "Description length", fix: "Add a compelling hook in the first 2 lines." },
          ],
        },
      };
    }
    await incrementAiRequestFlexible("video_seo_analysis");
    return { ok: true, data: parsed.data };
  } catch (err) {
    return { ok: false, error: { code: "INVALID_JSON", details: err instanceof Error ? err.message : undefined } };
  }
}
