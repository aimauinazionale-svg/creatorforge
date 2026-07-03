import { cookies } from "next/headers";

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

/** Reads JSON from a cookie, returning fallback when missing or invalid. */
export function readCookieJson<T>(key: string, fallback: T): T {
  try {
    const raw = cookies().get(key)?.value;
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as unknown;
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** Persists JSON to a cookie (no-op in read-only Server Component contexts). */
export function writeCookieJson<T>(key: string, value: T): void {
  try {
    cookies().set(key, JSON.stringify(value), COOKIE_OPTIONS);
  } catch {
    // Cookie writes can fail in read-only contexts.
  }
}
