import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/routing";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { fetchMyYouTubeChannel } from "@/lib/youtube/oauth";
import { persistChannelConnection } from "@/lib/youtube/persist-connection";
import type { Database } from "@/types/database";

function resolveRedirectPath(next: string | null, fallbackLocale: string): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  const locale = isLocale(fallbackLocale) ? fallbackLocale : defaultLocale;
  return `/${locale}/dashboard`;
}

function resolveLoginPath(redirectPath: string, fallbackLocale: string): string {
  const segment = redirectPath.split("/").filter(Boolean)[0];
  const locale = segment && isLocale(segment) ? segment : fallbackLocale;
  return `/${isLocale(locale) ? locale : defaultLocale}/login`;
}

/**
 * Exchanges a Supabase OAuth/magic-link code for a session and redirects.
 */
export async function handleAuthCallback(
  request: NextRequest,
  fallbackLocale: string = defaultLocale
) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectPath = resolveRedirectPath(searchParams.get("next"), fallbackLocale);
  const { url, anonKey } = getSupabaseConfig();

  if (!code) {
    return NextResponse.redirect(new URL(resolveLoginPath(redirectPath, fallbackLocale), origin));
  }

  const response = NextResponse.redirect(new URL(redirectPath, origin));
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const loginPath = resolveLoginPath(redirectPath, fallbackLocale);
    return NextResponse.redirect(new URL(`${loginPath}?error=auth`, origin));
  }

  const providerToken = data.session?.provider_token;
  const userId = data.session?.user?.id;
  const userEmail = data.session?.user?.email;

  if (providerToken && userId) {
    try {
      const channelStats = await fetchMyYouTubeChannel(providerToken);
      if (channelStats) {
        await persistChannelConnection(channelStats, {
          supabase,
          userId,
          userEmail,
        });
      }
    } catch (err) {
      console.error("[auth-callback:auto-connect-youtube]", err);
    }
  }

  return response;
}
