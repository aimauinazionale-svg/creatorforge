import { cache } from "react";

import { actionErr, type ActionResult } from "@/lib/actions/result";
import { getOrCreateGuestId } from "@/lib/onboarding/fallback";
import { isSupabaseSchemaError, logSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getChannelConnectionCookie } from "@/lib/youtube/connection-store";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type AuthContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
};

export type ChannelContext = AuthContext & {
  channelId: string;
  youtubeChannelId: string;
  fromCookie: boolean;
};

const getAuthContext = cache(async (): Promise<ActionResult<AuthContext>> => {
  try {
    const supabase = createSupabaseServerClient();
    const { data: auth, error } = await supabase.auth.getUser();
    if (error) return actionErr("UNAUTHENTICATED", error.message);
    if (!auth.user) return actionErr("UNAUTHENTICATED");
    return { ok: true, data: { supabase, userId: auth.user.id } };
  } catch (err) {
    console.error("[auth-context:getAuthContext]", err);
    return actionErr("UNKNOWN", err instanceof Error ? err.message : undefined);
  }
});

function channelContextFromCookie(
  supabase: SupabaseClient<Database>,
  userId: string
): ChannelContext | null {
  const cookie = getChannelConnectionCookie();
  if (!cookie) return null;

  return {
    supabase,
    userId,
    channelId: cookie.youtubeChannelId,
    youtubeChannelId: cookie.youtubeChannelId,
    fromCookie: true,
  };
}

const getChannelContext = cache(async (): Promise<ActionResult<ChannelContext>> => {
  try {
    const cookie = getChannelConnectionCookie();
    const ctx = await getAuthContext();

    if (!ctx.ok) {
      if (!cookie) return ctx;
      const supabase = createSupabaseServerClient();
      return {
        ok: true,
        data: {
          supabase,
          userId: getOrCreateGuestId(),
          channelId: cookie.youtubeChannelId,
          youtubeChannelId: cookie.youtubeChannelId,
          fromCookie: true,
        },
      };
    }

    const { data: channelRow, error } = await ctx.data.supabase
      .from("channels")
      .select("id, youtube_channel_id")
      .eq("user_id", ctx.data.userId)
      .maybeSingle();

    if (!error && channelRow?.id) {
      return {
        ok: true,
        data: {
          ...ctx.data,
          channelId: channelRow.id,
          youtubeChannelId: channelRow.youtube_channel_id,
          fromCookie: false,
        },
      };
    }

    const cookieCtx = channelContextFromCookie(ctx.data.supabase, ctx.data.userId);
    if (cookieCtx) return { ok: true, data: cookieCtx };

    if (error) {
      if (isSupabaseSchemaError(error)) {
        logSupabaseError("channels", error);
        return actionErr("YOUTUBE_NOT_CONNECTED");
      }
      logSupabaseError("channels", error);
      return actionErr("DB_ERROR");
    }

    return actionErr("YOUTUBE_NOT_CONNECTED");
  } catch (err) {
    console.error("[auth-context:getChannelContext]", err);
    const cookie = getChannelConnectionCookie();
    if (cookie) {
      const supabase = createSupabaseServerClient();
      return {
        ok: true,
        data: {
          supabase,
          userId: getOrCreateGuestId(),
          channelId: cookie.youtubeChannelId,
          youtubeChannelId: cookie.youtubeChannelId,
          fromCookie: true,
        },
      };
    }
    return actionErr("UNKNOWN", err instanceof Error ? err.message : undefined);
  }
});

export async function requireAuth(): Promise<ActionResult<AuthContext>> {
  return getAuthContext();
}

export async function requireChannel(): Promise<ActionResult<ChannelContext>> {
  return getChannelContext();
}
