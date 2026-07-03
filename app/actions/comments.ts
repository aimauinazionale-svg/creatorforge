"use server";

import { z } from "zod";

import { requireAuth } from "@/lib/actions/auth-context";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/result";
import { safeAction } from "@/lib/actions/safe";
import { analyzeSentiment, type SentimentBreakdown } from "@/lib/comments/sentiment";
import type { CommentInsight } from "@/lib/actions/types/comments";
import { fetchVideoComments } from "@/lib/youtube/api";

const AnalyzeSchema = z.object({
  videoUrl: z.string().min(5).max(500),
});

export async function analyzeVideoCommentsAction(
  input: z.infer<typeof AnalyzeSchema>
): Promise<
  ActionResult<{
    videoId: string;
    breakdown: SentimentBreakdown;
    topQuestions: string[];
    comments: CommentInsight[];
  }>
> {
  return safeAction(async () => {
  const ctx = await requireAuth();
  if (!ctx.ok) return ctx;

  const parsed = AnalyzeSchema.safeParse(input);
  if (!parsed.success) return actionErr("INVALID_INPUT");

  const match =
    /(?:v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{6,})/.exec(parsed.data.videoUrl) ??
    /\/embed\/([a-zA-Z0-9_-]{6,})/.exec(parsed.data.videoUrl);
  const videoId = match?.[1];
  if (!videoId) return actionErr("INVALID_INPUT", "Invalid YouTube video URL");

  const raw = await fetchVideoComments(videoId, 40);
  if (!raw.length) {
    return actionOk({
      videoId,
      breakdown: { positive: 0, neutral: 100, negative: 0, total: 0 },
      topQuestions: [],
      comments: [],
    });
  }

  const comments: CommentInsight[] = raw.map((c) => ({
    ...c,
    sentiment: analyzeSentiment(c.text),
  }));

  const counts = { positive: 0, neutral: 0, negative: 0 };
  for (const c of comments) counts[c.sentiment] += 1;
  const total = comments.length;
  const breakdown: SentimentBreakdown = {
    positive: Math.round((counts.positive / total) * 100),
    neutral: Math.round((counts.neutral / total) * 100),
    negative: Math.round((counts.negative / total) * 100),
    total,
  };

  const topQuestions = comments
    .map((c) => c.text)
    .filter((t) => t.includes("?"))
    .slice(0, 5);

  return actionOk({ videoId, breakdown, topQuestions, comments: comments.slice(0, 20) });

  }, "analyzeVideoCommentsAction");}
