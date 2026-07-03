import fs from "node:fs";
import { lemonSqueezySetup, listStores } from "@lemonsqueezy/lemonsqueezy.js";

const content = fs.readFileSync(".env.local", "utf8");
const match = content.match(/^LEMONSQUEEZY_API_KEY=(.+)$/m);
if (!match) {
  console.log("RESULT: missing_local_key");
  process.exit(1);
}

const apiKey = match[1].trim().replace(/^["']|["']$/g, "");
console.log(`local_key_len=${apiKey.length} jwt=${/^eyJ/.test(apiKey)}`);

lemonSqueezySetup({ apiKey, onError: (e) => console.error("ls_error", e.message) });

try {
  const stores = await listStores();
  const count = stores.data?.data?.length ?? 0;
  console.log(`RESULT: api_ok stores=${count}`);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.log(`RESULT: api_fail ${msg.slice(0, 120)}`);
  process.exit(1);
}
