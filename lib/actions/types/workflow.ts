export type WorkflowActionErrorCode =
  | "UNAUTHENTICATED"
  | "NOT_CONNECTED"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "DB_ERROR";

export type WorkflowActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: WorkflowActionErrorCode; details?: string } };
