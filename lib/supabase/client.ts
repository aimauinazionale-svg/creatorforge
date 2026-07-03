import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

/** Browser/client-component Supabase client (singleton). */
export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const config = getSupabaseConfig();
  browserClient = createBrowserClient<Database>(config.url, config.anonKey);
  return browserClient;
}

