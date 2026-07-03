import fs from "node:fs";
import {
  lemonSqueezySetup,
  listStores,
  listProducts,
  listVariants,
} from "@lemonsqueezy/lemonsqueezy.js";

function readEnv(key) {
  const content = fs.readFileSync(".env.local", "utf8");
  const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
  if (!match) return null;
  return match[1].trim().replace(/^["']|["']$/g, "");
}

const apiKey = readEnv("LEMONSQUEEZY_API_KEY");
lemonSqueezySetup({ apiKey, onError: (e) => console.error("err", e.message) });

const stores = await listStores();
for (const store of stores.data?.data ?? []) {
  console.log(`\nSTORE id=${store.id} name="${store.attributes?.name}"`);
  const products = await listProducts({ filter: { storeId: store.id } });
  for (const product of products.data?.data ?? []) {
    console.log(`  PRODUCT id=${product.id} name="${product.attributes?.name}" status=${product.attributes?.status}`);
    const variants = await listVariants({ filter: { productId: product.id } });
    for (const v of variants.data?.data ?? []) {
      console.log(
        `    VARIANT id=${v.id} name="${v.attributes?.name}" status=${v.attributes?.status} price=${v.attributes?.price}`
      );
    }
  }
}
