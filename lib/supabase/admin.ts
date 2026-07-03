import { createClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

/**
 * Supabase client with service role — server-only (webhooks, admin tasks).
 * Never import this module from Client Components.
 */
export function createSupabaseAdminClient() {
  const { url } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL for admin client."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Returns admin client or null when service role is not configured. */
export function tryCreateSupabaseAdminClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}
