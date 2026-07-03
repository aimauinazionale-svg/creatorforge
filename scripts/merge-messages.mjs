import fs from "fs";
import path from "path";

const messagesDir = path.join(process.cwd(), "messages");

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], value);
    } else if (!(key in target)) {
      target[key] = value;
    }
  }
  return target;
}

const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));

for (const locale of ["it", "es", "de", "fr", "pt", "ru", "ja", "zh"]) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const current = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const merged = deepMerge(structuredClone(current), en);
  fs.writeFileSync(filePath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`Merged missing keys into ${locale}.json`);
}
