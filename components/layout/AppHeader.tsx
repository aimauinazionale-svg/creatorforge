"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import { callServerAction } from "@/lib/actions/call-action";
import { Header, type HeaderUser } from "@/components/layout/Header";

export function AppHeader({ user }: { user: HeaderUser | null }) {
  const locale = useLocale();
  const router = useRouter();

  async function handleLogout() {
    const res = await callServerAction(() => signOut(locale));
    if (res.ok) {
      router.push(res.redirectTo);
      router.refresh();
    }
  }

  return <Header user={user} onLogout={() => void handleLogout()} />;
}
