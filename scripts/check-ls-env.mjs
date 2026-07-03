import fs from "node:fs";

const content = fs.readFileSync(".env.local", "utf8");
const keys = [
  "LEMONSQUEEZY_API_KEY",
  "LEMONSQUEEZY_STORE_ID",
  "LEMONSQUEEZY_VARIANT_ID",
  "LEMONSQUEEZY_WEBHOOK_SECRET",
];

for (const key of keys) {
  const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
  if (!match) {
    console.log(`${key}: MISSING`);
    continue;
  }
  const value = match[1].trim().replace(/^["']|["']$/g, "");
  const parts = value.split(".").length;
  console.log(
    `${key}: len=${value.length} jwt=${/^eyJ/.test(value)} parts=${parts} numeric=${/^\d+$/.test(value)} empty=${value.length === 0}`
  );
}
