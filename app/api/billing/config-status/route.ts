import { NextResponse } from "next/server";

import { isLemonSqueezyConfigured } from "@/lib/billing/lemonsqueezy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Temporary diagnostic — reports env presence (lengths only, no secrets). */
export async function GET() {
  const keys = [
    "LEMONSQUEEZY_API_KEY",
    "LEMONSQUEEZY_STORE_ID",
    "LEMONSQUEEZY_VARIANT_ID",
    "LEMONSQUEEZY_WEBHOOK_SECRET",
  ] as const;

  const lengths = Object.fromEntries(
    keys.map((key) => [key, (process.env[key] ?? "").length])
  );

  return NextResponse.json({
    configured: isLemonSqueezyConfigured(),
    lengths,
    runtime: "nodejs",
  });
}
