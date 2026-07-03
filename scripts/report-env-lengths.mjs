import fs from "fs";
import path from "path";
const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const envPath = path.join(root, "..", ".env.local");
const keys = ["SUPABASE_SERVICE_ROLE_KEY","LEMONSQUEEZY_WEBHOOK_SECRET","LEMONSQUEEZY_API_KEY","LEMONSQUEEZY_STORE_ID","LEMONSQUEEZY_VARIANT_ID"];
if (!fs.existsSync(envPath)) { console.log(".env.local: MISSING"); process.exit(1); }
const c = fs.readFileSync(envPath, "utf8");
for (const k of keys) {
  const re = new RegExp("^" + k + "=(.*)$", "m");
  const m = c.match(re);
  let v = m ? m[1].trim() : "";
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  console.log(k + ": " + (v ? "present len=" + v.length : "MISSING"));
}
