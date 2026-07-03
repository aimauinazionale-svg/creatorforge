import type { NextRequest } from "next/server";

import { handleAuthCallback } from "@/lib/auth/handle-auth-callback";
import { isLocale } from "@/i18n/routing";

/** Locale-prefixed callback fallback when middleware or Supabase uses /{locale}/auth/callback. */
export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string } }
) {
  const locale = isLocale(params.locale) ? params.locale : "en";
  return handleAuthCallback(request, locale);
}
