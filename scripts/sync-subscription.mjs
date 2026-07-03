/**
 * Manually sync a user's Pro subscription from LemonSqueezy → Supabase.
 *
 * Usage:
 *   node scripts/sync-subscription.mjs user@example.com
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { lemonSqueezySetup, listSubscriptions } from "@lemonsqueezy/lemonsqueezy.js";

const PRO_STATUSES = new Set(["active", "on_trial", "paused", "past_due"]);

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

function loadEnvLocal() {
  const content = fs.readFileSync(".env.local", "utf8");
  const map = {};
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (parsed) map[parsed.key] = parsed.value;
  }
  return map;
}

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/sync-subscription.mjs user@example.com");
  process.exit(1);
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = env.LEMONSQUEEZY_API_KEY;
const storeId = env.LEMONSQUEEZY_STORE_ID;

if (!url || !serviceKey || !apiKey || !storeId) {
  console.error("Missing required env in .env.local (url, service role, LS api key, store id).");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

lemonSqueezySetup({ apiKey, onError: (e) => console.error("ls_error", e) });

const { data: userRow, error: userErr } = await admin
  .from("users")
  .select("id, email, plan_type, subscription_status")
  .ilike("email", email)
  .maybeSingle();

if (userErr) {
  console.error("Supabase lookup failed:", userErr.message);
  process.exit(1);
}

if (!userRow) {
  console.error(`No user found for email: ${email}`);
  process.exit(1);
}

console.log(`User: ${userRow.id}`);
console.log(`Before: plan_type=${userRow.plan_type} status=${userRow.subscription_status ?? "null"}`);

const ls = await listSubscriptions({
  filter: { storeId: Number(storeId), userEmail: email },
});

if (ls.error) {
  console.error("LemonSqueezy listSubscriptions failed:", ls.statusCode);
  process.exit(1);
}

const subs = ls.data?.data ?? [];
if (subs.length === 0) {
  console.error("No LemonSqueezy subscription found for this email.");
  process.exit(1);
}

const active =
  subs.find((sub) => PRO_STATUSES.has(sub.attributes.status)) ?? subs[0];
const status = active.attributes.status ?? "unknown";
const planType = PRO_STATUSES.has(status) ? "pro" : "free";

const { error: updateErr } = await admin
  .from("users")
  .update({
    plan_type: planType,
    lemonsqueezy_customer_id: String(active.attributes.customer_id),
    lemonsqueezy_subscription_id: active.id,
    subscription_status: status,
  })
  .eq("id", userRow.id);

if (updateErr) {
  console.error("Supabase update failed:", updateErr.message);
  process.exit(1);
}

console.log(`After: plan_type=${planType} status=${status} subscription_id=${active.id}`);
console.log("Sync complete.");
