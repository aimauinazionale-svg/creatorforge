export type SupabaseConfig = {
  url: string;
  anonKey: string;
  isConfigured: boolean;
};

/**
 * Reads Supabase env vars without throwing when they are missing (dev mode).
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
  return {
    url: url || "https://placeholder.supabase.co",
    anonKey: anonKey || "placeholder-anon-key",
    isConfigured: Boolean(url && anonKey),
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

/**
 * `redirect_uri` sent to Google when users sign in via Supabase Auth.
 * Add this exact URL to Google Cloud Console → OAuth client → Authorized redirect URIs.
 */
export function getSupabaseAuthCallbackUrl(): string | null {
  const { url, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  return `${url.replace(/\/$/, "")}/auth/v1/callback`;
}
