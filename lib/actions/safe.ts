import { actionErr, type ActionResult } from "@/lib/actions/result";

/**
 * Wraps a server action body so uncaught errors return a structured result
 * instead of crashing the action fetch (client "Failed to fetch").
 */
export async function safeAction<T>(
  fn: () => Promise<ActionResult<T>>,
  label?: string
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[server-action${label ? `:${label}` : ""}]`, err);
    const details = err instanceof Error ? err.message : undefined;
    return actionErr("UNKNOWN", details);
  }
}

/**
 * Generic safe wrapper for actions that use custom result shapes.
 */
export async function safeRun<T extends { ok: boolean }>(
  fn: () => Promise<T>,
  toError: (details?: string) => Extract<T, { ok: false }>,
  label?: string
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[server-action${label ? `:${label}` : ""}]`, err);
    const details = err instanceof Error ? err.message : undefined;
    return toError(details);
  }
}
