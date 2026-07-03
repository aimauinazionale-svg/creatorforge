#!/usr/bin/env node
/**
 * Renders Sparkroll brand PNG/ICO assets from SVG sources.
 * Run: node scripts/generate-brand-icons.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

function renderPng(svgPath, outPath, width) {
  const svg = readFileSync(svgPath);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: "Segoe UI",
    },
  });
  writeFileSync(outPath, resvg.render().asPng());
  console.log(`Wrote ${outPath} (${width}px)`);
}

renderPng(join(publicDir, "icon.svg"), join(publicDir, "apple-touch-icon.png"), 180);
renderPng(join(publicDir, "icon.svg"), join(publicDir, "favicon-32.png"), 32);
renderPng(join(publicDir, "og-image.svg"), join(publicDir, "og-image.png"), 1200);

// Minimal ICO: single 32x32 PNG embedded (widely supported by browsers)
const png32 = readFileSync(join(publicDir, "favicon-32.png"));
const ico = Buffer.alloc(6 + 16 + png32.length);
ico.writeUInt16LE(0, 0); // reserved
ico.writeUInt16LE(1, 2); // type: icon
ico.writeUInt16LE(1, 4); // count
const entryOffset = 6 + 16;
ico.writeUInt8(32, 6); // width
ico.writeUInt8(32, 7); // height
ico.writeUInt8(0, 8); // palette
ico.writeUInt8(0, 9); // reserved
ico.writeUInt16LE(1, 10); // color planes
ico.writeUInt16LE(32, 12); // bpp
ico.writeUInt32LE(png32.length, 14); // size
ico.writeUInt32LE(entryOffset, 18); // offset
png32.copy(ico, entryOffset);
writeFileSync(join(publicDir, "favicon.ico"), ico);
console.log("Wrote public/favicon.ico");
