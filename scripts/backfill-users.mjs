/**
 * Backfill public.users from auth.users for existing auth accounts
 * (when handle_new_user trigger was missing or users table was empty).
 *
 * Usage:
 *   node scripts/backfill-users.mjs
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** @type {Set<string>} */
const existingIds = new Set();
let page = 1;

while (true) {
  const { data, error } = await admin
    .from("users")
    .select("id")
    .range((page - 1) * 500, page * 500 - 1);

  if (error) {
    console.error("Failed to list public.users:", error.message);
    process.exit(1);
  }

  if (!data?.length) break;
  for (const row of data) existingIds.add(row.id);
  if (data.length < 500) break;
  page += 1;
}

console.log(`Existing public.users rows: ${existingIds.size}`);

/** @type {{ id: string; email: string }[]} */
const toInsert = [];
page = 1;

while (page <= 50) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("Failed to list auth.users:", error.message);
    process.exit(1);
  }

  if (!data.users.length) break;

  for (const user of data.users) {
    if (existingIds.has(user.id)) continue;
    toInsert.push({
      id: user.id,
      email: user.email ?? "",
    });
  }

  if (data.users.length < 200) break;
  page += 1;
}

if (toInsert.length === 0) {
  console.log("Nothing to backfill — all auth users already have public.users rows.");
  process.exit(0);
}

console.log(`Backfilling ${toInsert.length} user(s)...`);

for (const row of toInsert) {
  const { error } = await admin.from("users").upsert(
    {
      id: row.id,
      email: row.email,
      plan_type: "free",
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (error) {
    console.error(`Failed for ${row.email || row.id}:`, error.message);
    process.exit(1);
  }

  console.log(`  + ${row.email || row.id}`);
}

console.log("Backfill complete.");
