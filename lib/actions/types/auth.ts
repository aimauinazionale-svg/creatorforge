export type AuthActionResult =
  | { ok: true; redirectUrl?: string }
  | {
      ok: false;
      error: {
        code: "INVALID_INPUT" | "AUTH_ERROR" | "MISSING_CONFIG" | "UNKNOWN";
        details?: string;
      };
    };

export type SignOutResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: { code: "UNKNOWN"; details?: string } };
