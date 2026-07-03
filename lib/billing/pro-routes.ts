import { isLocale } from "../../i18n/routing";

import { PROTECTED_PRO_ROUTES, type ProtectedProRoute } from "./constants";

/** Strips locale prefix from pathname and returns the first app segment, if any. */
export function getAppRouteSegment(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const first = segments[0];
  if (first && isLocale(first)) {
    return segments[1] ?? null;
  }

  return first ?? null;
}

/** Whether the pathname targets a Pro-only app route. */
export function isProProtectedPath(pathname: string): boolean {
  const segment = getAppRouteSegment(pathname);
  if (!segment) return false;
  return (PROTECTED_PRO_ROUTES as readonly string[]).includes(segment);
}

export function isProtectedProRoute(segment: string): segment is ProtectedProRoute {
  return (PROTECTED_PRO_ROUTES as readonly string[]).includes(segment);
}
