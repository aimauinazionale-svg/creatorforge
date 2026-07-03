import type { ActionErrorCode, ActionResult } from "@/lib/actions/result";

const FETCH_FAILURE_CODES = new Set(["Failed to fetch", "NetworkError", "Load failed"]);

function isFetchFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return FETCH_FAILURE_CODES.has(err.message) || err.name === "TypeError";
}

/**
 * Calls a server action from the client and converts network/fetch failures
 * into a structured error instead of an unhandled rejection.
 */
export async function callServerAction<T extends { ok: boolean }>(
  action: () => Promise<T>
): Promise<T> {
  try {
    return await action();
  } catch (err) {
    if (isFetchFailure(err)) {
      return { ok: false, error: { code: "NETWORK" } } as unknown as T;
    }
    return {
      ok: false,
      error: {
        code: "UNKNOWN",
        details: err instanceof Error ? err.message : undefined,
      },
    } as unknown as T;
  }
}

/** @deprecated Use callServerAction — kept for ActionResult call sites. */
export async function callAction<T>(
  action: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  return callServerAction(action);
}

export function actionErrorCode(err: unknown): ActionErrorCode {
  if (isFetchFailure(err)) return "NETWORK";
  return "UNKNOWN";
}
