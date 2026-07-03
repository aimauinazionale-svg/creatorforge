import { Resend } from "resend";

export type EmailType =
  | "weekly_digest"
  | "competitor_alert"
  | "publishing_reminder"
  | "goal_reached"
  | "onboarding";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  type: EmailType;
};

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function renderWeeklyDigestHtml(stats: {
  subscribers: number;
  views: number;
  videos: number;
}): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h1 style="color:#7c3aed">CreatorForge Weekly Digest</h1>
      <p>Here's your channel snapshot:</p>
      <ul>
        <li><strong>Subscribers:</strong> ${stats.subscribers.toLocaleString()}</li>
        <li><strong>Views:</strong> ${stats.views.toLocaleString()}</li>
        <li><strong>Videos:</strong> ${stats.videos.toLocaleString()}</li>
      </ul>
      <p style="color:#666;font-size:12px">Manage preferences in CreatorForge settings.</p>
    </div>
  `;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL ?? "CreatorForge <onboarding@resend.dev>";

  if (!resend) {
    return { ok: true, id: null };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id ?? null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" };
  }
}
