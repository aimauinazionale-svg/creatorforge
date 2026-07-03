import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/**
 * Next.js middleware helper to keep the Supabase auth session in sync.
 */
export async function updateSupabaseSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return response;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
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

  // Triggers session refresh if needed (and writes cookies via setAll).
  await supabase.auth.getUser();

  return response;
}
