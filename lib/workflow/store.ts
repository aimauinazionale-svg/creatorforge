import type { WorkflowCard } from "@/components/workflow/types";
import { readCookieJson, writeCookieJson } from "@/lib/storage/cookie-store";

const PREFIX = "cf_workflows_";

function cookieKey(actorId: string): string {
  return `${PREFIX}${actorId}`;
}

/** Reads workflow cards from cookie storage for the given actor. */
export function getWorkflowsFromCookie(actorId: string): WorkflowCard[] {
  const cards = readCookieJson<WorkflowCard[]>(cookieKey(actorId), []);
  return Array.isArray(cards) ? cards : [];
}

/** Persists workflow cards to cookie storage for the given actor. */
export function saveWorkflowsToCookie(actorId: string, cards: WorkflowCard[]): void {
  writeCookieJson(cookieKey(actorId), cards);
}
