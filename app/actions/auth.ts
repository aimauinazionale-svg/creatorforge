"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthActionResult, SignOutResult } from "@/lib/actions/types/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSiteUrl } from "@/lib/site";

function authErr(
  code: Extract<AuthActionResult, { ok: false }>["error"]["code"],
  details?: string
): AuthActionResult {
  return { ok: false, error: { code, details } };
}

export async function signInWithMagicLink(
  email: string,
  locale: string
): Promise<AuthActionResult> {
  try {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return authErr("INVALID_INPUT");
    }

    if (!isSupabaseConfigured()) {
      return authErr(
        "MISSING_CONFIG",
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }

    const supabase = createSupabaseServerClient();
    const siteUrl = getSiteUrl();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=/${locale}/dashboard`,
      },
    });

    if (error) return authErr("AUTH_ERROR", error.message);
    return { ok: true };
  } catch (err) {
    console.error("[server-action:signInWithMagicLink]", err);
    return authErr("UNKNOWN", err instanceof Error ? err.message : undefined);
  }
}

export async function signInWithGoogle(locale: string): Promise<AuthActionResult> {
  try {
    if (!isSupabaseConfigured()) {
      return authErr(
        "MISSING_CONFIG",
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }

    const supabase = createSupabaseServerClient();
    const siteUrl = getSiteUrl();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/${locale}/dashboard`,
        scopes: "https://www.googleapis.com/auth/youtube.readonly",
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    if (error) return authErr("AUTH_ERROR", error.message);
    if (!data.url) return authErr("AUTH_ERROR", "OAuth redirect URL missing");

    return { ok: true, redirectUrl: data.url };
  } catch (err) {
    console.error("[server-action:signInWithGoogle]", err);
    return authErr("UNKNOWN", err instanceof Error ? err.message : undefined);
  }
}

export async function signOut(locale: string): Promise<SignOutResult> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = createSupabaseServerClient();
      await supabase.auth.signOut();
    }
    return { ok: true, redirectTo: `/${locale}` };
  } catch (err) {
    console.error("[server-action:signOut]", err);
    return {
      ok: false,
      error: { code: "UNKNOWN", details: err instanceof Error ? err.message : undefined },
    };
  }
}
