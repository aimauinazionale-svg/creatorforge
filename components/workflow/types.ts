export const WORKFLOW_STATUSES = [
  "idea",
  "script",
  "recording",
  "editing",
  "upload",
  "published",
  "analyzed",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export type WorkflowCard = {
  id: string;
  title: string;
  description: string | null;
  status: WorkflowStatus;
  notes: string | null;
  dueDate: string | null;
  order: number;
  youtubeVideoId: string | null;
  createdAt: string;
};
