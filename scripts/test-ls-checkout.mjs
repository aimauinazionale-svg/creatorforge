import fs from "node:fs";
import {
  lemonSqueezySetup,
  createCheckout,
  listStores,
  listProducts,
} from "@lemonsqueezy/lemonsqueezy.js";

function readEnv(key) {
  const content = fs.readFileSync(".env.local", "utf8");
  const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
  if (!match) return null;
  return match[1].trim().replace(/^["']|["']$/g, "");
}

const apiKey = readEnv("LEMONSQUEEZY_API_KEY");
const storeId = readEnv("LEMONSQUEEZY_STORE_ID");
const variantId = readEnv("LEMONSQUEEZY_VARIANT_ID");
const siteUrl = readEnv("NEXT_PUBLIC_SITE_URL") ?? "https://sparkroll-maui-org.vercel.app";

if (!apiKey || !storeId || !variantId) {
  console.log("RESULT: missing_env", {
    apiKey: Boolean(apiKey),
    storeId: Boolean(storeId),
    variantId: Boolean(variantId),
  });
  process.exit(1);
}

console.log(`store_id=${storeId} variant_id=${variantId} site_url=${siteUrl}`);

lemonSqueezySetup({
  apiKey,
  onError: (e) => console.error("ls_onError", e.message?.slice(0, 200)),
});

try {
  const stores = await listStores();
  const storeList = stores.data?.data ?? [];
  console.log(`stores=${storeList.length} ids=${storeList.map((s) => s.id).join(",")}`);

  const storeMatch = storeList.some((s) => String(s.id) === String(storeId));
  console.log(`store_match=${storeMatch}`);

  const products = await listProducts({ filter: { storeId } });
  const productList = products.data?.data ?? [];
  console.log(`products=${productList.length}`);

  let variantFound = false;
  for (const product of productList) {
    const variants = product.attributes?.variants ?? [];
    for (const v of variants) {
      if (String(v.id) === String(variantId)) {
        variantFound = true;
        console.log(
          `variant_found product="${product.attributes?.name}" status=${v.status} price=${v.price}`
        );
      }
    }
  }
  if (!variantFound) {
    console.log("RESULT: variant_not_in_store_products");
  }

  const checkout = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: "test@example.com",
      custom: { user_id: "test-user-id" },
    },
    productOptions: {
      redirectUrl: `${siteUrl}/settings/billing?checkout=success`,
      receiptButtonText: "Go to billing",
      receiptThankYouNote: "Thank you for upgrading!",
    },
  });

  const url = checkout.data?.data?.attributes?.url;
  if (url) {
    console.log(`RESULT: checkout_ok url_len=${url.length}`);
  } else {
    console.log("RESULT: checkout_no_url", JSON.stringify(checkout.error ?? checkout.data)?.slice(0, 300));
    process.exit(1);
  }
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.log(`RESULT: checkout_fail ${msg.slice(0, 300)}`);
  process.exit(1);
}
