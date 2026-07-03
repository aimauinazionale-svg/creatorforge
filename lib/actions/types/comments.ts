export type CommentInsight = {
  text: string;
  author: string;
  likeCount: number;
  sentiment: "positive" | "neutral" | "negative";
};
