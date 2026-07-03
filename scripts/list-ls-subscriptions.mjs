/**
 * Lists LemonSqueezy subscriptions for the configured store.
 *
 * Usage: node scripts/list-ls-subscriptions.mjs
 */
import fs from "node:fs";
import { lemonSqueezySetup, listSubscriptions } from "@lemonsqueezy/lemonsqueezy.js";

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
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const parsed = parseEnvLine(line);
  if (parsed) map[parsed.key] = parsed.value;
}

const apiKey = map.LEMONSQUEEZY_API_KEY;
const storeId = map.LEMONSQUEEZY_STORE_ID;
if (!apiKey || !storeId) {
  console.error("Missing LEMONSQUEEZY_API_KEY or LEMONSQUEEZY_STORE_ID");
  process.exit(1);
}

lemonSqueezySetup({ apiKey, onError: (e) => console.error("ls_error", e) });

const ls = await listSubscriptions({ filter: { storeId: Number(storeId) } });
if (ls.error) {
  console.error("listSubscriptions failed:", ls.statusCode);
  process.exit(1);
}

const subs = ls.data?.data ?? [];
console.log(`Store ${storeId}: ${subs.length} subscription(s)`);
for (const sub of subs) {
  const a = sub.attributes;
  console.log(
    `- id=${sub.id} status=${a.status} email=${a.user_email} customer=${a.customer_id}`
  );
}
