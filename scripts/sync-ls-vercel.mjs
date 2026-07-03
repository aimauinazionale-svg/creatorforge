import fs from "node:fs";
import { spawnSync } from "node:child_process";

const content = fs.readFileSync(".env.local", "utf8");
const keys = [
  "LEMONSQUEEZY_API_KEY",
  "LEMONSQUEEZY_STORE_ID",
  "LEMONSQUEEZY_VARIANT_ID",
  "LEMONSQUEEZY_WEBHOOK_SECRET",
];

const map = {};
for (const line of content.split(/\r?\n/)) {
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  let v = line.slice(idx + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  map[k] = v;
}

const targets = ["production", "preview"];
const results = [];

for (const key of keys) {
  const value = map[key];
  if (!value) {
    results.push({ key, status: "missing_local" });
    continue;
  }

  for (const target of targets) {
    const proc = spawnSync(
      "npx",
      ["vercel", "env", "add", key, target, "--force", "--yes", "--sensitive"],
      {
        input: value,
        encoding: "utf8",
        cwd: process.cwd(),
        shell: true,
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    const ok = proc.status === 0;
    results.push({
      key,
      target,
      status: ok ? "synced" : "failed",
      stderr: ok ? "" : (proc.stderr || "").slice(0, 200),
    });
  }
}

for (const r of results) {
  console.log(`${r.key}@${r.target ?? "local"}: ${r.status}${r.stderr ? " err=" + r.stderr.trim() : ""}`);
}
