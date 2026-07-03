import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";

export default async function DashboardLoading() {
  await getTranslations("dashboard");
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
