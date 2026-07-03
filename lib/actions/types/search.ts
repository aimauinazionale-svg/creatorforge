export type SearchResultItem = {
  id: string;
  type: "idea" | "workflow";
  title: string;
  href: string;
  subtitle?: string;
};
