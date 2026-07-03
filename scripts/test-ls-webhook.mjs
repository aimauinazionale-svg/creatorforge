/**
 * Sends a signed test webhook to a local or deployed endpoint.
 *
 * Usage:
 *   node scripts/test-ls-webhook.mjs [baseUrl]
 *
 * Default baseUrl: http://localhost:3000
 * Requires LEMONSQUEEZY_WEBHOOK_SECRET in .env.local
 */
import crypto from "node:crypto";
import fs from "node:fs";

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

function loadWebhookSecret() {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (parsed?.key === "LEMONSQUEEZY_WEBHOOK_SECRET") return parsed.value;
  }
  return null;
}

const baseUrl = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const secret = loadWebhookSecret();
const testUserId = process.argv[3] ?? "00000000-0000-4000-8000-000000000001";

if (!secret) {
  console.error("LEMONSQUEEZY_WEBHOOK_SECRET missing in .env.local");
  process.exit(1);
}

const body = JSON.stringify({
  meta: {
    event_name: "subscription_created",
    custom_data: { user_id: testUserId },
  },
  data: {
    id: "999999",
    type: "subscriptions",
    attributes: {
      store_id: 1,
      customer_id: 1,
      user_email: "test@example.com",
      status: "active",
    },
  },
});

const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
const url = `${baseUrl}/api/webhooks/lemonsqueezy`;

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Signature": signature,
  },
  body,
});

const text = await res.text();
console.log(`POST ${url}`);
console.log(`Status: ${res.status}`);
console.log(`Body: ${text}`);
