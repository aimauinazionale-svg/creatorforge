import fs from "node:fs";
import { spawnSync } from "node:child_process";

const content = fs.readFileSync(".env.local", "utf8");
const keys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "LEMONSQUEEZY_API_KEY",
  "LEMONSQUEEZY_STORE_ID",
  "LEMONSQUEEZY_VARIANT_ID",
  "LEMONSQUEEZY_WEBHOOK_SECRET",
];

/** Numeric IDs are safe to store as non-sensitive so pull can verify sync. */
const NON_SENSITIVE_KEYS = new Set(["LEMONSQUEEZY_STORE_ID", "LEMONSQUEEZY_VARIANT_ID"]);

/** @param {string} line */
function parseEnvLine(line) {
  if (!line || line.startsWith("#") || !line.includes("=")) return null;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  let v = line.slice(idx + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return { key: k, value: v };
}

const map = {};
for (const line of content.split(/\r?\n/)) {
  const parsed = parseEnvLine(line);
  if (parsed) map[parsed.key] = parsed.value;
}

const targets = ["production", "preview"];
const results = [];

/**
 * @param {string} key
 * @param {string} value
 * @param {string} target
 */
function syncVar(key, value, target) {
  const args = ["vercel", "env", "add", key, target, "--force", "--yes"];
  if (NON_SENSITIVE_KEYS.has(key)) {
    args.push("--no-sensitive");
  } else {
    args.push("--sensitive");
  }

  const proc = spawnSync("npx", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    input: value,
    shell: true,
    stdio: ["pipe", "pipe", "pipe"],
  });

  return {
    ok: proc.status === 0,
    stderr: (proc.stderr || "").trim(),
    stdout: (proc.stdout || "").trim(),
  };
}


const LENGTH_HINTS = {
  SUPABASE_SERVICE_ROLE_KEY: 200,
  LEMONSQUEEZY_WEBHOOK_SECRET: 32,
};

for (const [key, minLen] of Object.entries(LENGTH_HINTS)) {
  const len = map[key]?.length ?? 0;
  if (len > 0 && len < minLen) {
    console.warn(`WARN: ${key} local_len=${len} (expected ~${minLen}+ before webhooks can work reliably)`);
  }
}
for (const key of keys) {
  const value = map[key];
  if (!value) {
    results.push({ key, target: "local", status: "missing_local" });
    continue;
  }

  console.log(`${key}: local_len=${value.length}`);

  for (const target of targets) {
    const { ok, stderr, stdout } = syncVar(key, value, target);
    results.push({
      key,
      target,
      status: ok ? "synced" : "failed",
      detail: ok ? stdout : stderr || stdout,
    });
  }
}

let failed = 0;
for (const r of results) {
  const extra = r.detail ? ` ${String(r.detail).slice(0, 200)}` : "";
  console.log(`${r.key}@${r.target ?? "local"}: ${r.status}${extra}`);
  if (r.status === "failed" || r.status === "missing_local") failed++;
}

if (failed > 0) {
  console.error(`\nSync finished with ${failed} problem(s).`);
  process.exit(1);
}

console.log("\nVerifying non-sensitive IDs via production pull...");
const verifyPath = ".env.vercel.production.verify";
const pull = spawnSync(
  "npx",
  ["vercel", "env", "pull", verifyPath, "--environment=production", "--yes"],
  { cwd: process.cwd(), encoding: "utf8", shell: true, stdio: ["ignore", "pipe", "pipe"] }
);

if (pull.status !== 0) {
  console.error("Pull verification failed:", (pull.stderr || "").slice(0, 300));
  process.exit(1);
}

const pulled = fs.readFileSync(verifyPath, "utf8");
fs.unlinkSync(verifyPath);

let verifyFailed = false;
for (const key of NON_SENSITIVE_KEYS) {
  const localLen = map[key]?.length ?? 0;
  const re = new RegExp(`^${key}="(.*)"$`, "m");
  const match = pulled.match(re);
  const pulledLen = match ? match[1].length : -1;
  console.log(`${key}: local_len=${localLen} pulled_len=${pulledLen}`);
  if (pulledLen !== localLen) verifyFailed = true;
}

if (verifyFailed) {
  console.error("\nVerification failed: numeric IDs did not sync correctly (stdin may be empty on Windows).");
  process.exit(1);
}

console.log("\nNumeric IDs verified. Redeploy production, then check /api/billing/config-status.");
