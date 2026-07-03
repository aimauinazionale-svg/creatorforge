import { Skeleton } from "@/components/ui/skeleton";

export default function SeoLabLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
