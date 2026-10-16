// PWA 아이콘 생성: node scripts/gen-icons.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";

const svg = readFileSync(new URL("../public/favicon.svg", import.meta.url));
const out = (f) => new URL(`../public/icons/${f}`, import.meta.url).pathname;
await sharp(svg, { density: 1200 }).resize(192, 192).png().toFile(out("icon-192.png"));
await sharp(svg, { density: 1200 }).resize(512, 512).png().toFile(out("icon-512.png"));
await sharp(svg, { density: 1200 }).resize(180, 180).flatten({ background: "#0b1020" }).png().toFile(out("apple-touch-icon.png"));
// maskable: 안전 영역(80%) 안에 로고
const inner = await sharp(svg, { density: 1200 }).resize(360, 360).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#0b1020" } })
  .composite([{ input: inner, gravity: "center" }]).png().toFile(out("icon-512-maskable.png"));
console.log("icons ok");
