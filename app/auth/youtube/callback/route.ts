import type { NextRequest } from "next/server";

import { handleYouTubeOAuthCallback } from "@/lib/youtube/handle-oauth-callback";

/** Standalone YouTube OAuth callback (no locale prefix — Google redirect URL). */
export async function GET(request: NextRequest) {
  return handleYouTubeOAuthCallback(request);
}
