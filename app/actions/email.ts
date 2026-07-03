"use server";

import { requireAuth } from "@/lib/actions/auth-context";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/result";
import { safeAction } from "@/lib/actions/safe";
import type { EmailPreferences } from "@/lib/actions/types/email";

function mapPrefs(row: {
  email: string;
  unsubscribed_all: boolean;
  weekly_digest_enabled: boolean;
  weekly_digest_frequency: string;
  competitor_alerts_enabled: boolean;
  publishing_reminders_enabled: boolean;
  goal_reached_enabled: boolean;
  onboarding_enabled: boolean;
}): EmailPreferences {
  return {
    email: row.email,
    unsubscribedAll: row.unsubscribed_all,
    weeklyDigestEnabled: row.weekly_digest_enabled,
    weeklyDigestFrequency: row.weekly_digest_frequency,
    competitorAlertsEnabled: row.competitor_alerts_enabled,
    publishingRemindersEnabled: row.publishing_reminders_enabled,
    goalReachedEnabled: row.goal_reached_enabled,
    onboardingEnabled: row.onboarding_enabled,
  };
}

export async function getEmailPreferencesAction(): Promise<ActionResult<{ prefs: EmailPreferences | null }>> {
  return safeAction(async () => {
  const ctx = await requireAuth();
  if (!ctx.ok) return ctx;

  const { data, error } = await ctx.data.supabase
    .from("email_preferences")
    .select("*")
    .eq("user_id", ctx.data.userId)
    .maybeSingle();

  if (error) return actionErr("DB_ERROR", error.message);
  if (!data) return actionOk({ prefs: null });
  return actionOk({ prefs: mapPrefs(data) });

  }, "getEmailPreferencesAction");}

export async function saveEmailPreferencesAction(
  prefs: Partial<EmailPreferences>
): Promise<ActionResult<{ prefs: EmailPreferences }>> {
  return safeAction(async () => {
  const ctx = await requireAuth();
  if (!ctx.ok) return ctx;

  const { data: user } = await ctx.data.supabase.auth.getUser();
  const email = user.user?.email ?? prefs.email ?? "";
  if (!email) return actionErr("INVALID_INPUT");

  const { data, error } = await ctx.data.supabase
    .from("email_preferences")
    .upsert({
      user_id: ctx.data.userId,
      email,
      unsubscribed_all: prefs.unsubscribedAll ?? false,
      weekly_digest_enabled: prefs.weeklyDigestEnabled ?? true,
      weekly_digest_frequency: prefs.weeklyDigestFrequency ?? "weekly",
      competitor_alerts_enabled: prefs.competitorAlertsEnabled ?? true,
      publishing_reminders_enabled: prefs.publishingRemindersEnabled ?? true,
      goal_reached_enabled: prefs.goalReachedEnabled ?? true,
      onboarding_enabled: prefs.onboardingEnabled ?? true,
    })
    .select("*")
    .single();

  if (error || !data) return actionErr("DB_ERROR", error?.message);
  return actionOk({ prefs: mapPrefs(data) });

  }, "saveEmailPreferencesAction");}
