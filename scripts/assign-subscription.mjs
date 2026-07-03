/**
 * Assign a LemonSqueezy subscription to a user by login email.
 * Use when checkout email differs from auth email.
 *
 * Usage:
 *   node scripts/assign-subscription.mjs user@login.com <subscription_id>
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { lemonSqueezySetup, getSubscription } from "@lemonsqueezy/lemonsqueezy.js";

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
  const map = {};
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (parsed) map[parsed.key] = parsed.value;
  }
  return map;
}

const email = process.argv[2]?.trim().toLowerCase();
const subscriptionId = process.argv[3]?.trim();

if (!email || !email.includes("@") || !subscriptionId) {
  console.error("Usage: node scripts/assign-subscription.mjs user@login.com <subscription_id>");
  process.exit(1);
}

const env = loadEnvLocal();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

lemonSqueezySetup({ apiKey: env.LEMONSQUEEZY_API_KEY });

const sub = await getSubscription(subscriptionId);
if (sub.error || !sub.data?.data) {
  console.error("Subscription not found in LemonSqueezy:", subscriptionId);
  process.exit(1);
}

const attrs = sub.data.data.attributes;
const status = attrs.status ?? "unknown";
const planType = ["active", "on_trial", "paused", "past_due"].includes(status) ? "pro" : "free";

let page = 1;
/** @type {{ id: string } | undefined} */
let authUser;

while (page <= 10) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error || !data.users.length) break;
  const match = data.users.find((u) => u.email?.trim().toLowerCase() === email);
  if (match) {
    authUser = match;
    break;
  }
  if (data.users.length < 200) break;
  page += 1;
}

if (!authUser) {
  console.error(`No auth user for ${email}`);
  process.exit(1);
}

await admin.from("users").upsert(
  { id: authUser.id, email, plan_type: "free" },
  { onConflict: "id", ignoreDuplicates: true }
);

const { error: updateErr } = await admin
  .from("users")
  .update({
    plan_type: planType,
    lemonsqueezy_customer_id: String(attrs.customer_id),
    lemonsqueezy_subscription_id: subscriptionId,
    subscription_status: status,
  })
  .eq("id", authUser.id);

if (updateErr) {
  console.error("Update failed:", updateErr.message);
  process.exit(1);
}

console.log(`Assigned subscription ${subscriptionId} (${status}) to ${email} → plan_type=${planType}`);
console.log(`LS checkout email: ${attrs.user_email}`);
