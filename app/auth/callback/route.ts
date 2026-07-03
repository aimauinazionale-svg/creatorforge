import type { NextRequest } from "next/server";

import { handleAuthCallback } from "@/lib/auth/handle-auth-callback";

/** OAuth/magic-link callback without locale prefix (Supabase redirect URL). */
export async function GET(request: NextRequest) {
  return handleAuthCallback(request);
}
