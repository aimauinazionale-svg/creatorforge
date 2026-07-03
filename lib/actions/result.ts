export type ActionErrorCode =
  | "UNAUTHENTICATED"
  | "RATE_LIMITED"
  | "YOUTUBE_NOT_CONNECTED"
  | "NOT_CONNECTED"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "DB_ERROR"
  | "NETWORK"
  | "UNKNOWN"
  | "AUTH_ERROR"
  | "MISSING_CONFIG"
  | "TIMEOUT"
  | "INVALID_JSON"
  | "PROVIDER_ERROR"
  | "INTERNAL";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ActionErrorCode; details?: string } };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionErr<T>(
  code: ActionErrorCode,
  details?: string
): ActionResult<T> {
  return { ok: false, error: { code, details } };
}

/** Maps provider/internal codes to user-facing retry-worthy errors. */
export function toUserFacingCode(code: string): ActionErrorCode {
  switch (code) {
    case "UNAUTHENTICATED":
    case "RATE_LIMITED":
    case "YOUTUBE_NOT_CONNECTED":
    case "NOT_CONNECTED":
    case "INVALID_INPUT":
    case "NOT_FOUND":
    case "DB_ERROR":
    case "NETWORK":
    case "AUTH_ERROR":
    case "MISSING_CONFIG":
    case "TIMEOUT":
    case "INVALID_JSON":
      return code;
    case "PROVIDER_ERROR":
    case "INTERNAL":
      return "UNKNOWN";
    default:
      return "UNKNOWN";
  }
}
