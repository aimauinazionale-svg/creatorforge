import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isLocale, routing } from "./i18n/routing";
import {
  FREE_PLAN,
  PLAN_COOKIE_NAME,
  PRO_PLAN,
  type PlanType,
} from "./lib/billing/constants";
import { getPlanFromCookie, isProPlan, planTypeToCookieValue, resolvePlanType } from "./lib/billing/plan";
import { isProProtectedPath } from "./lib/billing/pro-routes";
import { getSupabaseConfig } from "./lib/supabase/env";
import type { Database } from "./types/database";

const intlMiddleware = createMiddleware(routing);

function isAuthCallbackPath(pathname: string): boolean {
  if (pathname === "/auth/callback" || pathname === "/auth/callback/") {
    return true;
  }

  const match = pathname.match(/^\/([^/]+)\/auth\/callback\/?$/);
  return Boolean(match?.[1] && isLocale(match[1]));
}

/** Server Actions POST to the page URL with this header — must not be rewritten by i18n middleware. */
function isServerActionRequest(request: NextRequest): boolean {
  return (
    request.method === "POST" &&
    (request.headers.has("next-action") || request.headers.has("Next-Action"))
  );
}

function getLocaleFromPath(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment && isLocale(segment) ? segment : routing.defaultLocale;
}

function normalizePlanType(value: string | null | undefined): PlanType {
  return value === PRO_PLAN ? PRO_PLAN : FREE_PLAN;
}

function createSupabaseOnResponse(request: NextRequest, response: NextResponse) {
  const { url, anonKey } = getSupabaseConfig();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });
}

async function refreshSupabaseSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request });
  const { isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return response;
  }

  const supabase = createSupabaseOnResponse(request, response);
  await supabase.auth.getUser();
  return response;
}

async function syncPlanCookie(
  request: NextRequest,
  response: NextResponse,
  supabase: ReturnType<typeof createSupabaseOnResponse>
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    response.cookies.delete(PLAN_COOKIE_NAME);
    return;
  }

  const { data } = await supabase
    .from("users")
    .select("plan_type")
    .eq("id", user.id)
    .maybeSingle();

  const plan = normalizePlanType(data?.plan_type);
  response.cookies.set(PLAN_COOKIE_NAME, planTypeToCookieValue(plan), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isServerActionRequest(request) || isAuthCallbackPath(pathname)) {
    return refreshSupabaseSession(request);
  }

  const response = intlMiddleware(request);
  const { isConfigured } = getSupabaseConfig();

  if (isConfigured) {
    const supabase = createSupabaseOnResponse(request, response);
    await supabase.auth.getUser();
    await syncPlanCookie(request, response, supabase);

    if (isProProtectedPath(pathname)) {
      const pro = await (async () => {
        const cookiePlan = getPlanFromCookie(request);
        if (cookiePlan && isProPlan(cookiePlan)) return true;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return false;

        const { data } = await supabase
          .from("users")
          .select("plan_type")
          .eq("id", user.id)
          .maybeSingle();

        return isProPlan(resolvePlanType(data?.plan_type, cookiePlan));
      })();

      if (!pro) {
        const locale = getLocaleFromPath(pathname);
        const pricingUrl = new URL(`/${locale}/pricing`, request.url);
        pricingUrl.searchParams.set("upgrade", "1");
        return NextResponse.redirect(pricingUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
