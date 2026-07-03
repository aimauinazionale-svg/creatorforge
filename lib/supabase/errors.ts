/** PostgREST / Postgres errors when tables or schema are not provisioned yet. */
export function isSupabaseSchemaError(
  error: { message?: string; code?: string } | null | undefined
): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table") ||
    msg.includes("does not exist") ||
    msg.includes("relation") && msg.includes("does not exist")
  );
}

/** Strips raw provider messages before returning errors to the client. */
export function logSupabaseError(label: string, error: { message?: string }): void {
  console.error(`[supabase:${label}]`, error.message ?? error);
}
