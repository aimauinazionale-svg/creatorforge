export type KeywordResult = {
  keyword: string;
  score: number;
  competition: "low" | "medium" | "high";
  reasoning: string;
};
