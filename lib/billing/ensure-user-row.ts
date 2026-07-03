import { tryCreateSupabaseAdminClient } from "@/lib/supabase/admin";

export type EnsureUserRowResult =
  | { ok: true; created: boolean }
  | { ok: false; message: string };

/**
 * Ensures a row exists in public.users for the given auth user id.
 * Creates one from auth.users when missing (signup trigger gap / legacy data).
 */
export async function ensurePublicUserRow(
  userId: string,
  email?: string | null
): Promise<EnsureUserRowResult> {
  const admin = tryCreateSupabaseAdminClient();
  if (!admin) {
    return { ok: false, message: "Admin client unavailable." };
  }

  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return { ok: true, created: false };
  }

  let resolvedEmail = email?.trim() ?? "";
  if (!resolvedEmail) {
    const { data: authData, error: authErr } = await admin.auth.admin.getUserById(userId);
    if (authErr || !authData.user) {
      return { ok: false, message: `Auth user not found: ${userId}` };
    }
    resolvedEmail = authData.user.email ?? "";
  }

  const { error: insertErr } = await admin.from("users").upsert(
    {
      id: userId,
      email: resolvedEmail,
      plan_type: "free",
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (insertErr) {
    return { ok: false, message: insertErr.message };
  }

  return { ok: true, created: true };
}
