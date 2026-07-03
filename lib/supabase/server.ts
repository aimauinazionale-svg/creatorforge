import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/**
 * Server Supabase client for Server Components & Server Actions.
 * Uses Next.js `cookies()` for auth persistence.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In Server Components, setting cookies can throw. In Server Actions/Route Handlers it's fine.
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Intentionally ignore in RSC contexts.
        }
      },
    },
  });
}

