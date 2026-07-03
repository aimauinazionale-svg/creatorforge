import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Skeleton className="mb-8 h-24 w-72 max-w-full" />
      <Skeleton className="h-80 w-full max-w-md rounded-xl" />
    </div>
  );
}
