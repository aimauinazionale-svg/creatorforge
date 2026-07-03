const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

const VIDEO_URL_PATTERNS = [
  /(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([a-zA-Z0-9_-]{11})/,
  /\/live\/([a-zA-Z0-9_-]{11})/,
];

/** Parses a YouTube video URL or bare video ID. */
export function parseVideoInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (VIDEO_ID_PATTERN.test(trimmed)) return trimmed;

  for (const pattern of VIDEO_URL_PATTERNS) {
    const match = pattern.exec(trimmed);
    if (match?.[1]) return match[1];
  }

  return null;
}
