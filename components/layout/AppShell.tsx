"use client";

import type { AppUser } from "@/lib/auth/session";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { signOut } from "@/app/actions/auth";
import { callServerAction } from "@/lib/actions/call-action";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export type AppShellProps = {
  user: AppUser;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const locale = useLocale();
  const router = useRouter();

  async function handleLogout() {
    const res = await callServerAction(() => signOut(locale));
    if (res.ok) {
      router.push(res.redirectTo);
      router.refresh();
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-h-dvh flex-col overflow-x-hidden md:pl-64">
        <Header
          user={{
            name: user.name ?? undefined,
            email: user.email ?? undefined,
            imageUrl: user.imageUrl ?? undefined,
          }}
          onLogout={() => void handleLogout()}
        />
        <main className="flex-1 overflow-x-hidden px-3 py-5 sm:px-4 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
