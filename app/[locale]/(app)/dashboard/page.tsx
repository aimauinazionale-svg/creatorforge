import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardFallback } from "@/components/dashboard/DashboardFallback";

export default async function DashboardPage() {
  try {
    return <DashboardShell />;
  } catch (error) {
    console.error("[dashboard/page]", error);
    return <DashboardFallback />;
  }
}
