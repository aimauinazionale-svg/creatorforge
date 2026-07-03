export type IdeaRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  priority: number;
  status: string;
  notes: string | null;
  createdAt: string;
};
