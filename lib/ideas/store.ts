import type { IdeaRow } from "@/lib/actions/types/ideas-bank";
import { readCookieJson, writeCookieJson } from "@/lib/storage/cookie-store";

const PREFIX = "cf_ideas_";

function cookieKey(actorId: string): string {
  return `${PREFIX}${actorId}`;
}

/** Reads ideas from cookie storage for the given actor. */
export function getIdeasFromCookie(actorId: string): IdeaRow[] {
  const ideas = readCookieJson<IdeaRow[]>(cookieKey(actorId), []);
  return Array.isArray(ideas) ? ideas : [];
}

/** Persists ideas to cookie storage for the given actor. */
export function saveIdeasToCookie(actorId: string, ideas: IdeaRow[]): void {
  writeCookieJson(cookieKey(actorId), ideas);
}
