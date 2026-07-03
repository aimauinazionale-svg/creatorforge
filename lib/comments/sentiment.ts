/** Lightweight keyword-based sentiment (no heavy NLP deps). */

export type SentimentBreakdown = {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
};

const POSITIVE = [
  "love",
  "great",
  "awesome",
  "amazing",
  "helpful",
  "thanks",
  "thank",
  "best",
  "excellent",
  "perfect",
  "good",
  "nice",
  "fantastic",
  "brilliant",
];

const NEGATIVE = [
  "hate",
  "bad",
  "worst",
  "terrible",
  "boring",
  "wrong",
  "awful",
  "disappoint",
  "trash",
  "stupid",
  "clickbait",
  "spam",
  "waste",
];

export function analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of POSITIVE) if (lower.includes(w)) score += 1;
  for (const w of NEGATIVE) if (lower.includes(w)) score -= 1;
  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}
