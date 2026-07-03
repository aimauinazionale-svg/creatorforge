const PATHNAME_PATTERNS: ReadonlyArray<{
  type: ParsedChannelRef["type"];
  pattern: RegExp;
}> = [
  { type: "id", pattern: /^\/channel\/(UC[\w-]{22})\/?$/i },
  { type: "handle", pattern: /^\/@([\w.-]+)\/?$/i },
  { type: "username", pattern: /^\/c\/([\w.-]+)\/?$/i },
  { type: "username", pattern: /^\/user\/([\w.-]+)\/?$/i },
];

const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"];

export type ParsedChannelRef =
  | { type: "id"; value: string }
  | { type: "handle"; value: string }
  | { type: "username"; value: string };

function isYouTubeHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return YOUTUBE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

/** Parses a YouTube channel URL or handle into a lookup reference. */
export function parseChannelInput(input: string): ParsedChannelRef | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("@")) {
    const handle = trimmed.slice(1).trim();
    return handle ? { type: "handle", value: handle } : null;
  }

  if (/^UC[\w-]{22}$/i.test(trimmed)) {
    return { type: "id", value: trimmed };
  }

  try {
    const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    if (isYouTubeHostname(url.hostname)) {
      const pathname = url.pathname.replace(/\/+$/, "") || "/";
      for (const { type, pattern } of PATHNAME_PATTERNS) {
        const match = pathname.match(pattern);
        if (match?.[1]) {
          return { type, value: match[1] };
        }
      }
    }
  } catch {
    // fall through to bare-handle detection
  }

  if (/^[\w.-]+$/.test(trimmed) && !trimmed.includes("/")) {
    return { type: "handle", value: trimmed };
  }

  return null;
}
