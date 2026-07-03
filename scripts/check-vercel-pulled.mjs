import fs from "node:fs";

const pulled = fs.readFileSync(".env.vercel.production", "utf8");
const keys = [
  "LEMONSQUEEZY_API_KEY",
  "LEMONSQUEEZY_STORE_ID",
  "LEMONSQUEEZY_VARIANT_ID",
  "LEMONSQUEEZY_WEBHOOK_SECRET",
];

for (const key of keys) {
  const re = new RegExp(`^${key}="(.*)"$`, "m");
  const match = pulled.match(re);
  const len = match ? match[1].length : -1;
  console.log(`${key}: pulled_len=${len}`);
}
