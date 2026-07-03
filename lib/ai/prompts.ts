const JSON_RULES = [
  "Return ONLY valid JSON.",
  "Do NOT wrap in markdown or code fences.",
  "Do NOT include explanations outside JSON.",
  "Use double quotes for all strings.",
].join(" ");

function normalizeList(items: string[]): string[] {
  return items.map((s) => s.trim()).filter(Boolean);
}

export function generateVideoIdeasPrompt(topic: string, niche: string, targetAudience: string) {
  return {
    system: `You are an expert YouTube strategist. ${JSON_RULES}`,
    user: JSON.stringify(
      {
        task: "Generate YouTube video ideas",
        topic,
        niche,
        targetAudience,
        output_schema: {
          ideas: [
            {
              title: "string (max 90 chars)",
              description: "string (1-3 sentences)",
              targetKeywords: ["string"],
              estimatedDifficulty: "low|medium|high",
              uniqueAngle: "string",
            },
          ],
        },
        constraints: {
          ideasCount: 5,
          keywordsCountPerIdea: "3-6",
          avoidGeneric: true,
          avoidDuplicateIdeas: true,
        },
      },
      null,
      2
    ),
  } as const;
}

export function optimizeTitlePrompt(title: string, topic: string, keywords: string[]) {
  return {
    system: `You are an expert YouTube title optimizer. ${JSON_RULES}`,
    user: JSON.stringify(
      {
        task: "Optimize a YouTube title",
        inputTitle: title,
        topic,
        keywords: normalizeList(keywords),
        output_schema: {
          suggestions: [
            {
              title: "string (max 90 chars)",
              score: "number (0-100)",
              reasoning: "string (1-2 sentences)",
            },
          ],
        },
        constraints: {
          suggestionsCount: 3,
          includeKeywordsNaturally: true,
          noClickbaitLies: true,
        },
      },
      null,
      2
    ),
  } as const;
}

export function generateDescriptionPrompt(
  title: string,
  keywords: string[],
  keyPoints: string[]
) {
  return {
    system: `You are an expert YouTube SEO copywriter. ${JSON_RULES}`,
    user: JSON.stringify(
      {
        task: "Generate an SEO-optimized YouTube description",
        title,
        keywords: normalizeList(keywords),
        keyPoints: normalizeList(keyPoints),
        output_schema: {
          description: "string",
          hashtags: ["string (3-5 items)"],
        },
        constraints: {
          includeHook: true,
          includeTimestampsTemplate: true,
          includeCTA: true,
          maxHashtags: 5,
        },
      },
      null,
      2
    ),
  } as const;
}

export function generateTagsPrompt(title: string, description: string, topic: string) {
  return {
    system: `You are an expert YouTube SEO assistant. ${JSON_RULES}`,
    user: JSON.stringify(
      {
        task: "Generate YouTube tags",
        title,
        description,
        topic,
        output_schema: { tags: ["string"] },
        constraints: {
          tagsCount: "15-20",
          sortedByRelevance: true,
          noHashtags: true,
          avoidDuplicates: true,
        },
      },
      null,
      2
    ),
  } as const;
}

export function generateScriptOutlinePrompt(title: string, duration: string, style: string) {
  return {
    system: `You are an expert YouTube scriptwriter. ${JSON_RULES}`,
    user: JSON.stringify(
      {
        task: "Generate a YouTube script outline",
        title,
        duration,
        style,
        output_schema: {
          hook: "string (attention-grabbing opening line)",
          intro: "string (1-2 sentences)",
          sections: [
            {
              sectionTitle: "string",
              timeRange: "string (e.g. 0:00-0:20)",
              bullets: ["string"],
            },
          ],
          cta: "string (call to action)",
          outro: "string (closing line)",
        },
        constraints: {
          sectionsCount: "4-6",
          includeHook: true,
          includeCTA: true,
        },
      },
      null,
      2
    ),
  } as const;
}

export function dailyInsightsPrompt(context: {
  channelName: string;
  subscriberCount: number;
  videoCount: number;
  topVideoTitle: string | null;
  topVideoViews: number;
  locale: string;
}) {
  return {
    system: `You are an expert YouTube growth coach. ${JSON_RULES}`,
    user: JSON.stringify(
      {
        task: "Generate daily creator insights and action items",
        locale: context.locale,
        channel: {
          name: context.channelName,
          subscribers: context.subscriberCount,
          videos: context.videoCount,
          topVideo: context.topVideoTitle,
          topVideoViews: context.topVideoViews,
        },
        output_schema: {
          dailyTip: "string (1-2 sentences, actionable tip for today)",
          focusArea: "string (e.g. SEO, thumbnails, consistency)",
          actionItems: ["string (3 specific tasks for today)"],
          bestVideoHint: "string (insight about top performing content)",
        },
      },
      null,
      2
    ),
  } as const;
}

export function trendingTopicsPrompt(
  niche: string,
  videos: Array<{ title: string; views: number; channel: string }>,
  locale: string
) {
  return {
    system: `You are an expert YouTube trend analyst. ${JSON_RULES}`,
    user: JSON.stringify(
      {
        task: "Summarize trending topics in a YouTube niche",
        locale,
        niche,
        recentVideos: videos,
        output_schema: {
          topics: [
            {
              title: "string (video idea title)",
              keyword: "string (main keyword)",
              trendScore: "number (0-100)",
              summary: "string (why this is trending, 1 sentence)",
            },
          ],
        },
        constraints: {
          topicsCount: "3-5",
          actionable: true,
        },
      },
      null,
      2
    ),
  } as const;
}

export function weeklyReportPrompt(context: {
  channelName: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  recentVideos: Array<{ title: string; views: number }>;
  locale: string;
}) {
  return {
    system: `You are an expert YouTube analytics advisor. ${JSON_RULES}`,
    user: JSON.stringify(
      {
        task: "Generate a weekly creator performance report preview",
        locale: context.locale,
        channel: context,
        output_schema: {
          headline: "string (weekly summary headline)",
          growthSummary: "string (2-3 sentences about channel progress)",
          highlights: ["string (2-3 positive highlights)"],
          improvements: ["string (2-3 areas to improve)"],
          nextWeekGoals: ["string (3 goals for next week)"],
          estimatedGrowth: "string (realistic growth projection)",
        },
      },
      null,
      2
    ),
  } as const;
}

export function titleVariantsPrompt(
  title: string,
  topic: string,
  options: { includeEmoji: boolean; powerWords: boolean; count: number }
) {
  return {
    system: `You are an expert YouTube title optimizer focused on CTR. ${JSON_RULES}`,
    user: JSON.stringify(
      {
        task: "Generate A/B title variants with predicted CTR hooks",
        inputTitle: title,
        topic,
        options,
        output_schema: {
          variants: [
            {
              title: "string (max 90 chars)",
              ctrHook: "string (e.g. curiosity gap, urgency, social proof)",
              predictedScore: "number (0-100)",
              lengthChars: "number",
              usesEmoji: "boolean",
              powerWords: ["string"],
            },
          ],
        },
        constraints: {
          variantsCount: options.count,
          noClickbaitLies: true,
          varyHooks: true,
        },
      },
      null,
      2
    ),
  } as const;
}

export function analyzeVideoSeoPrompt(video: {
  title: string;
  description: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
}) {
  return {
    system: `You are an expert YouTube SEO analyst. ${JSON_RULES}`,
    user: JSON.stringify(
      {
        task: "Analyze and score YouTube video SEO with improvement suggestions",
        video,
        output_schema: {
          overallScore: "number (0-100)",
          titleScore: "number (0-100)",
          descriptionScore: "number (0-100)",
          tagsScore: "number (0-100)",
          suggestedTitle: "string (improved title)",
          suggestedDescription: "string (first 200 chars of improved description)",
          suggestedTags: ["string"],
          improvements: [
            {
              area: "string (title|description|tags)",
              issue: "string",
              fix: "string",
            },
          ],
        },
      },
      null,
      2
    ),
  } as const;
}

