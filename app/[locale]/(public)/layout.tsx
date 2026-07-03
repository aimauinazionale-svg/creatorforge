import { PublicFooter } from "@/components/landing/PublicFooter";
import { PublicHeader } from "@/components/landing/PublicHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
