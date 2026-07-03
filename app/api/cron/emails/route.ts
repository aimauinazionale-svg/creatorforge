import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { renderWeeklyDigestHtml, sendEmail } from "@/lib/email/send";

export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/** Cron endpoint for weekly digest and publishing reminders. */
export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const { data: prefs, error } = await supabase
    .from("email_preferences")
    .select("user_id, email, weekly_digest_enabled, unsubscribed_all")
    .eq("weekly_digest_enabled", true)
    .eq("unsubscribed_all", false)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const pref of prefs ?? []) {
    const { data: channel } = await supabase
      .from("channels")
      .select("stats_cache")
      .eq("user_id", pref.user_id)
      .maybeSingle();

    const stats = (channel?.stats_cache ?? {}) as Record<string, number>;
    const result = await sendEmail({
      to: pref.email,
      subject: "Your CreatorForge weekly digest",
      html: renderWeeklyDigestHtml({
        subscribers: Number(stats.subscriberCount ?? 0),
        views: Number(stats.viewCount ?? 0),
        videos: Number(stats.videoCount ?? 0),
      }),
      type: "weekly_digest",
    });

    const status = result.ok ? (result.id ? "sent" : "skipped") : "failed";
    if (status === "sent") sent += 1;
    else if (status === "skipped") skipped += 1;
    else failed += 1;

    await supabase.from("email_logs").insert({
      user_id: pref.user_id,
      to_email: pref.email,
      type: "weekly_digest",
      subject: "Your CreatorForge weekly digest",
      status,
      resend_id: result.ok ? result.id : null,
      error: result.ok ? null : result.error,
    });
  }

  return NextResponse.json({ sent, skipped, failed, processed: (prefs ?? []).length });
}
