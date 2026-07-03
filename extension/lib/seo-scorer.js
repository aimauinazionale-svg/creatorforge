/**
 * Client-side YouTube SEO scoring — pure JS, no API required.
 * Weights: Title 25%, Description 25%, Tags 20%, Engagement 15%, Metadata 15%
 */
(function initCreatorForgeSeoScorer(global) {
  if (global.__CF_SEO_SCORER_LOADED__) return;
  global.__CF_SEO_SCORER_LOADED__ = true;

  const POWER_WORDS = [
    "ultimate", "complete", "guide", "best", "top", "how", "why", "secret", "proven",
    "easy", "fast", "free", "new", "official", "review", "tutorial", "tips", "tricks",
    "step", "beginner", "advanced", "essential", "must", "watch", "learn", "master",
  ];

  const CLICKBAIT_PATTERNS = [
    /\byou won't believe\b/i,
    /\bshocking\b/i,
    /\bgone wrong\b/i,
    /\bdestroyed\b/i,
    /\bexposed\b/i,
    /\b\d+\s*reasons\b/i,
    /\bthis changes everything\b/i,
    /!{3,}/,
    /\?\?+/,
    /[A-Z]{8,}/,
  ];

  const STOP_WORDS = new Set([
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "is", "it", "this", "that", "my", "your", "our", "i", "we", "you",
    "how", "what", "why", "when", "where", "who", "vs", "vs.", "|", "-",
  ]);

  /**
   * @param {number} score
   * @returns {"red" | "yellow" | "green"}
   */
  function scoreColor(score) {
    if (score <= 40) return "red";
    if (score <= 70) return "yellow";
    return "green";
  }

  /**
   * @param {string} text
   * @returns {string[]}
   */
  function extractKeywords(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s#]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  }

  /**
   * @param {number} value
   * @param {number} idealMin
   * @param {number} idealMax
   * @param {number} [hardMax]
   */
  function lengthScore(value, idealMin, idealMax, hardMax) {
    if (value <= 0) return 0;
    if (value >= idealMin && value <= idealMax) return 100;
    if (value < idealMin) {
      const ratio = value / idealMin;
      return Math.round(Math.max(20, ratio * 85));
    }
    const over = value - idealMax;
    const maxOver = (hardMax || idealMax * 2) - idealMax;
    return Math.round(Math.max(30, 100 - (over / maxOver) * 60));
  }

  /**
   * @param {{ title: string; description: string; tags: string[]; views: number | null; likes: number | null; uploadDate: string | null; hasHashtags: boolean; hasTimestamps: boolean; hasLinks: boolean; channelName: string }} data
   */
  function scoreTitle(data) {
    const title = data.title || "";
    const len = title.length;
    const lenScore = lengthScore(len, 50, 60, 100);

    const keywords = extractKeywords(title);
    const keywordScore = keywords.length >= 3 ? 100 : keywords.length >= 2 ? 75 : keywords.length >= 1 ? 50 : 20;

    const lower = title.toLowerCase();
    const powerHits = POWER_WORDS.filter((w) => lower.includes(w)).length;
    const powerScore = Math.min(100, 40 + powerHits * 20);

    let clickbaitPenalty = 0;
    for (const pattern of CLICKBAIT_PATTERNS) {
      if (pattern.test(title)) clickbaitPenalty += 15;
    }
    const clarityScore = Math.max(0, 100 - clickbaitPenalty);

    const score = Math.round(lenScore * 0.35 + keywordScore * 0.25 + powerScore * 0.2 + clarityScore * 0.2);
    return {
      score,
      details: { length: len, idealMin: 50, idealMax: 60, keywords: keywords.length, powerHits, clickbaitPenalty },
    };
  }

  /**
   * @param {{ title: string; description: string; tags: string[]; views: number | null; likes: number | null; uploadDate: string | null; hasHashtags: boolean; hasTimestamps: boolean; hasLinks: boolean; channelName: string }} data
   */
  function scoreDescription(data) {
    const desc = data.description || "";
    const len = desc.length;
    const lenScore = len >= 200 ? (len >= 500 ? 100 : 70 + Math.min(30, (len - 200) / 10)) : Math.round((len / 200) * 60);

    const titleKeywords = extractKeywords(data.title);
    const first150 = desc.slice(0, 150).toLowerCase();
    const keywordHits = titleKeywords.filter((k) => first150.includes(k)).length;
    const keywordScore =
      titleKeywords.length === 0
        ? 50
        : Math.round(Math.min(100, (keywordHits / Math.max(1, titleKeywords.length)) * 100));

    const timestampScore = data.hasTimestamps ? 100 : desc.match(/\d{1,2}:\d{2}/) ? 80 : 20;
    const linkScore = data.hasLinks ? 100 : 30;
    const hashtagScore = data.hasHashtags ? 100 : 40;

    const score = Math.round(lenScore * 0.35 + keywordScore * 0.3 + timestampScore * 0.15 + linkScore * 0.1 + hashtagScore * 0.1);
    return {
      score,
      details: { length: len, keywordHits, hasTimestamps: data.hasTimestamps, hasLinks: data.hasLinks, hasHashtags: data.hasHashtags },
    };
  }

  /**
   * @param {{ title: string; description: string; tags: string[]; views: number | null; likes: number | null; uploadDate: string | null; hasHashtags: boolean; hasTimestamps: boolean; hasLinks: boolean; channelName: string }} data
   */
  function scoreTags(data) {
    const tags = data.tags || [];
    const count = tags.length;

    let countScore;
    if (count === 0) countScore = 15;
    else if (count < 5) countScore = 40 + count * 8;
    else if (count <= 15) countScore = 100;
    else if (count <= 30) countScore = 70;
    else countScore = 40;

    const titleKeywords = extractKeywords(data.title);
    const tagLower = tags.map((t) => t.toLowerCase());
    const relevanceHits = titleKeywords.filter((k) => tagLower.some((t) => t.includes(k) || k.includes(t))).length;
    const relevanceScore =
      count === 0
        ? 30
        : Math.round(Math.min(100, (relevanceHits / Math.max(1, titleKeywords.length)) * 100));

    const score = Math.round(countScore * 0.6 + relevanceScore * 0.4);
    return { score, details: { count, relevanceHits, estimated: data.tagsEstimated } };
  }

  /**
   * @param {{ title: string; description: string; tags: string[]; views: number | null; likes: number | null; uploadDate: string | null; hasHashtags: boolean; hasTimestamps: boolean; hasLinks: boolean; channelName: string; daysSinceUpload: number | null }} data
   */
  function scoreEngagement(data) {
    const views = data.views;
    const likes = data.likes;

    let likeRatioScore = 40;
    let likeRatio = null;
    if (views != null && views > 0 && likes != null) {
      likeRatio = likes / views;
      if (likeRatio >= 0.05) likeRatioScore = 100;
      else if (likeRatio >= 0.03) likeRatioScore = 85;
      else if (likeRatio >= 0.02) likeRatioScore = 70;
      else if (likeRatio >= 0.01) likeRatioScore = 55;
      else likeRatioScore = 35;
    }

    let velocityHint = null;
    let velocityScore = 50;
    if (views != null && data.daysSinceUpload != null && data.daysSinceUpload > 0) {
      const viewsPerDay = views / data.daysSinceUpload;
      velocityHint = viewsPerDay;
      if (viewsPerDay >= 10000) velocityScore = 100;
      else if (viewsPerDay >= 1000) velocityScore = 85;
      else if (viewsPerDay >= 100) velocityScore = 70;
      else if (viewsPerDay >= 10) velocityScore = 55;
      else velocityScore = 40;
    }

    const score = Math.round(likeRatioScore * 0.65 + velocityScore * 0.35);
    return { score, details: { likeRatio, viewsPerDay: velocityHint, daysSinceUpload: data.daysSinceUpload } };
  }

  /**
   * @param {{ title: string; description: string; tags: string[]; views: number | null; likes: number | null; uploadDate: string | null; hasHashtags: boolean; hasTimestamps: boolean; hasLinks: boolean; channelName: string }} data
   */
  function scoreMetadata(data) {
    let points = 0;
    const checks = [];

    if (data.title && data.title.length > 5) {
      points += 25;
      checks.push({ id: "hasTitle", pass: true });
    } else checks.push({ id: "hasTitle", pass: false });

    if (data.description && data.description.length > 50) {
      points += 25;
      checks.push({ id: "hasDescription", pass: true });
    } else checks.push({ id: "hasDescription", pass: false });

    if (data.tags && data.tags.length > 0) {
      points += 20;
      checks.push({ id: "hasTags", pass: true });
    } else checks.push({ id: "hasTags", pass: false });

    if (data.uploadDate) {
      points += 15;
      checks.push({ id: "hasUploadDate", pass: true });
    } else checks.push({ id: "hasUploadDate", pass: false });

    if (data.channelName && data.channelName !== "Channel") {
      points += 15;
      checks.push({ id: "hasChannel", pass: true });
    } else checks.push({ id: "hasChannel", pass: false });

    return { score: points, details: { checks } };
  }

  /**
   * @param {ReturnType<typeof analyzeVideo>} result
   */
  function generateTips(result, data) {
    const tips = [];
    const titleLen = data.title?.length || 0;

    if (titleLen < 40) tips.push("Title too short — aim for 50–60 characters for better CTR.");
    else if (titleLen > 70) tips.push("Title may be too long — keep it under 70 characters to avoid truncation.");

    if (result.categories.title.details.clickbaitPenalty > 0) {
      tips.push("Reduce clickbait patterns — avoid ALL CAPS, excessive !!!, or sensational phrases.");
    }

    if ((data.description?.length || 0) < 200) {
      tips.push("Description too short — write at least 200 characters with keywords in the first 150.");
    }

    const titleKw = extractKeywords(data.title);
    const first150 = (data.description || "").slice(0, 150).toLowerCase();
    if (titleKw.length > 0 && !titleKw.some((k) => first150.includes(k))) {
      tips.push("Add main keywords to the first 150 characters of your description.");
    }

    if (!data.hasTimestamps) tips.push("Add chapter timestamps — they improve watch time and search visibility.");
    if (!data.hasLinks) tips.push("Include relevant links in the description (social, resources, playlists).");
    if (!data.hasHashtags) tips.push("Add 2–3 relevant hashtags at the end of the description.");

    const tagCount = data.tags?.length || 0;
    if (tagCount === 0) tips.push("Add 5–15 relevant tags — enable YouTube API key in extension options for accurate tag scoring.");
    else if (tagCount < 5) tips.push(`Only ${tagCount} tags detected — aim for 5–15 relevant tags.`);

    if (result.categories.engagement.details.likeRatio != null && result.categories.engagement.details.likeRatio < 0.02) {
      tips.push("Engagement is low — ask viewers to like and comment to boost the like/view ratio.");
    }

    tips.push("Analyze thumbnail contrast and text in CreatorForge Thumbnail Analyzer.");

    return tips.slice(0, 8);
  }

  /**
   * @param {{ title: string; description: string; tags: string[]; views: number | null; likes: number | null; uploadDate: string | null; hasHashtags: boolean; hasTimestamps: boolean; hasLinks: boolean; channelName: string; daysSinceUpload: number | null; tagsEstimated?: boolean }} data
   */
  function buildMetrics(data, categories) {
    const titleLen = data.title?.length || 0;
    const descLen = data.description?.length || 0;
    const tagCount = data.tags?.length || 0;
    const titleKw = extractKeywords(data.title);

    const likeRatio = categories.engagement.details.likeRatio;
    const likeRatioPct = likeRatio != null ? `${(likeRatio * 100).toFixed(2)}%` : "—";

    const metrics = [
      {
        id: "titleLength",
        label: "Title length",
        display: `${titleLen}/60 chars`,
        pass: titleLen >= 50 && titleLen <= 60,
        progress: Math.min(100, Math.round((titleLen / 60) * 100)),
      },
      {
        id: "keywordsInTitle",
        label: "Keywords in title",
        display: `${titleKw.length} keyword${titleKw.length !== 1 ? "s" : ""}`,
        pass: titleKw.length >= 2,
        progress: Math.min(100, titleKw.length * 33),
      },
      {
        id: "descLength",
        label: "Description length",
        display: `${descLen}/5000 (min 200)`,
        pass: descLen >= 200,
        progress: Math.min(100, Math.round((descLen / 5000) * 100)),
      },
      {
        id: "hashtags",
        label: "Has hashtags",
        display: data.hasHashtags ? "Yes" : "No",
        pass: data.hasHashtags,
        progress: data.hasHashtags ? 100 : 0,
      },
      {
        id: "tags",
        label: data.tagsEstimated ? "Tags (estimated)" : "Tags",
        display: `${tagCount} tags`,
        pass: tagCount >= 5 && tagCount <= 15,
        progress: tagCount === 0 ? 0 : Math.min(100, Math.round((tagCount / 15) * 100)),
      },
      {
        id: "engagement",
        label: "Like/view ratio",
        display: likeRatioPct,
        pass: likeRatio != null && likeRatio >= 0.02,
        progress: likeRatio != null ? Math.min(100, Math.round(likeRatio * 2000)) : 0,
      },
    ];

    if (categories.engagement.details.viewsPerDay != null) {
      const vpd = categories.engagement.details.viewsPerDay;
      metrics.push({
        id: "velocity",
        label: "Views velocity",
        display: `${Math.round(vpd).toLocaleString("en-US")}/day`,
        pass: vpd >= 100,
        progress: Math.min(100, Math.round(Math.log10(vpd + 1) * 25)),
      });
    }

    return metrics;
  }

  /**
   * @param {{ title: string; description: string; tags: string[]; views: number | null; likes: number | null; uploadDate: string | null; hasHashtags: boolean; hasTimestamps: boolean; hasLinks: boolean; channelName: string; daysSinceUpload: number | null; tagsEstimated?: boolean }} data
   */
  function analyzeVideo(data) {
    const title = scoreTitle(data);
    const description = scoreDescription(data);
    const tags = scoreTags(data);
    const engagement = scoreEngagement(data);
    const metadata = scoreMetadata(data);

    const overall = Math.round(
      title.score * 0.25 +
        description.score * 0.25 +
        tags.score * 0.2 +
        engagement.score * 0.15 +
        metadata.score * 0.15
    );

    const categories = { title, description, tags, engagement, metadata };
    const metrics = buildMetrics(data, categories);
    const tips = generateTips({ categories, overall }, data);

    return {
      overall,
      color: scoreColor(overall),
      categories: {
        title: { ...title, label: "Title", weight: 25 },
        description: { ...description, label: "Description", weight: 25 },
        tags: { ...tags, label: "Tags", weight: 20 },
        engagement: { ...engagement, label: "Engagement", weight: 15 },
        metadata: { ...metadata, label: "Metadata", weight: 15 },
        thumbnail: { score: null, label: "Thumbnail", note: "Analyze in CreatorForge" },
      },
      metrics,
      tips,
    };
  }

  /**
   * @param {{ subscribers: number | null; videos: number | null; views: number | null; name: string; recentUploadHint: string | null }} data
   */
  function analyzeChannel(data) {
    const subs = data.subscribers;
    const videoCount = data.videos;
    const totalViews = data.views;

    let subsScore = 40;
    if (subs != null) {
      if (subs >= 1_000_000) subsScore = 100;
      else if (subs >= 100_000) subsScore = 85;
      else if (subs >= 10_000) subsScore = 70;
      else if (subs >= 1_000) subsScore = 55;
      else subsScore = 40;
    }

    let videosScore = 50;
    if (videoCount != null) {
      if (videoCount >= 50 && videoCount <= 500) videosScore = 100;
      else if (videoCount >= 20) videosScore = 80;
      else if (videoCount >= 5) videosScore = 60;
      else videosScore = 35;
    }

    let avgViewsScore = 50;
    let avgViews = null;
    if (totalViews != null && videoCount != null && videoCount > 0) {
      avgViews = Math.round(totalViews / videoCount);
      if (avgViews >= 100_000) avgViewsScore = 100;
      else if (avgViews >= 10_000) avgViewsScore = 85;
      else if (avgViews >= 1_000) avgViewsScore = 70;
      else if (avgViews >= 100) avgViewsScore = 55;
      else avgViewsScore = 40;
    }

    const overall = Math.round(subsScore * 0.35 + videosScore * 0.25 + avgViewsScore * 0.4);
    const tips = [];

    if (videoCount != null && videoCount < 10) tips.push("Upload more videos — channels with 20+ videos tend to rank better.");
    if (avgViews != null && subs != null && subs > 0 && avgViews < subs * 0.1) {
      tips.push("Average views per video is low relative to subscribers — review content strategy.");
    }
    if (data.recentUploadHint === "inactive") tips.push("No recent uploads detected — consistent upload schedule helps channel health.");
    else if (data.recentUploadHint === "active") tips.push("Good upload activity — keep a consistent schedule.");

    return {
      overall,
      color: scoreColor(overall),
      subsScore,
      videosScore,
      avgViewsScore,
      avgViews,
      tips,
    };
  }

  global.CreatorForgeSeoScorer = {
    analyzeVideo,
    analyzeChannel,
    scoreColor,
  };
})(window);
