import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/site";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { isYouTubeOAuthConfigured } from "@/lib/youtube/api";
import { fetchMyYouTubeChannel } from "@/lib/youtube/oauth";
import { persistChannelConnection } from "@/lib/youtube/persist-connection";
import type { Database } from "@/types/database";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

function getYouTubeOAuthRedirectUri(): string {
  return process.env.YOUTUBE_REDIRECT_URI ?? `${getSiteUrl()}/auth/youtube/callback`;
}

function parseOAuthState(state: string | null): { userId: string | null; locale: string } {
  if (!state) return { userId: null, locale: defaultLocale };

  const colon = state.indexOf(":");
  if (colon <= 0) return { userId: null, locale: defaultLocale };

  const userId = state.slice(0, colon);
  const locale = state.slice(colon + 1);
  return {
    userId: userId || null,
    locale: isLocale(locale) ? locale : defaultLocale,
  };
}

async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getYouTubeOAuthRedirectUri(),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("[youtube-oauth:token]", await res.text());
    return null;
  }

  return (await res.json()) as GoogleTokenResponse;
}

/**
 * Handles the standalone YouTube OAuth callback (`/auth/youtube/callback`).
 * Exchanges the code, fetches the user's channel, and persists the connection.
 */
export async function handleYouTubeOAuthCallback(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const { userId: expectedUserId, locale } = parseOAuthState(searchParams.get("state"));

  const settingsUrl = new URL(`/${locale}/settings`, origin);

  function redirectWithStatus(status: string) {
    settingsUrl.searchParams.set("youtube", status);
    return NextResponse.redirect(settingsUrl);
  }

  if (oauthError || !code) {
    return redirectWithStatus("error");
  }

  if (!isYouTubeOAuthConfigured()) {
    return redirectWithStatus("not_configured");
  }

  const tokens = await exchangeCodeForTokens(code);
  if (!tokens?.access_token) {
    return redirectWithStatus("error");
  }

  const channelStats = await fetchMyYouTubeChannel(tokens.access_token);
  if (!channelStats) {
    return redirectWithStatus("no_channel");
  }

  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return redirectWithStatus("error");
  }

  settingsUrl.searchParams.set("youtube", "connected");
  const response = NextResponse.redirect(settingsUrl);

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL(`/${locale}/login`, origin);
    loginUrl.searchParams.set("next", `/${locale}/settings`);
    return NextResponse.redirect(loginUrl);
  }

  if (expectedUserId && user.id !== expectedUserId) {
    return redirectWithStatus("error");
  }

  await persistChannelConnection(channelStats, {
    supabase,
    userId: user.id,
    userEmail: user.email,
  });

  await supabase
    .from("users")
    .update({
      youtube_tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
      },
    })
    .eq("id", user.id);

  return response;
}
