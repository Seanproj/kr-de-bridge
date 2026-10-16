// OG 이미지 생성 (카드 제목이 들어간 1200×630 PNG): node scripts/gen-og.mjs
// 전역 playwright 또는 프로젝트 devDependency playwright가 필요하다. 카드 제목이 바뀌면 다시 실행해 커밋한다.
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH ?? "/opt/node-tools/node_modules/playwright")); }

const root = new URL("..", import.meta.url).pathname;
const cards = JSON.parse(readFileSync(root + "data/cards.json", "utf8"));
const fontDir = root + "node_modules/pretendard/dist/web/static/woff2/";
const font = (w, f) => `@font-face{font-family:P;font-weight:${w};src:url(file://${fontDir}${f})}`;
const fonts = font(500, "Pretendard-Medium.woff2") + font(800, "Pretendard-ExtraBold.woff2");
const DIR = { "KR→DE": "🇰🇷 → 🇩🇪  한국 → 독일", "DE→KR": "🇩🇪 → 🇰🇷  독일 → 한국", DE: "🇩🇪  독일 현지", KR: "🇰🇷  한국 업무" };
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

const page = (title, sub, tag) => `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;font-family:P,sans-serif;background:#0b1020;color:#f3f5fa;position:relative;overflow:hidden;word-break:keep-all}
.g1{position:absolute;left:-200px;top:-220px;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,#1d4ed8aa,transparent 65%)}
.g2{position:absolute;right:-220px;top:-60px;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,#f2b20088,transparent 65%)}
.g3{position:absolute;left:300px;bottom:-420px;width:800px;height:700px;border-radius:50%;background:radial-gradient(circle,#e0383e77,transparent 65%)}
.in{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column}
.tag{font-size:26px;font-weight:500;color:#ffffffb0}
h1{margin-top:auto;font-size:${title.length > 22 ? 62 : 74}px;line-height:1.12;font-weight:800;letter-spacing:-.035em;max-width:1040px}
p{margin-top:22px;font-size:27px;line-height:1.45;color:#ffffffa0;max-width:1000px;font-weight:500;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bar{position:absolute;left:0;right:0;bottom:0;height:10px;background:linear-gradient(90deg,#3b6cff,#ff4d55 52%,#ffc400)}
.brand{position:absolute;right:72px;top:62px;font-size:24px;font-weight:800;display:flex;gap:12px;align-items:center}
</style></head><body><div class="g1"></div><div class="g2"></div><div class="g3"></div>
<div class="in"><div class="tag">${esc(tag)}</div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>
<div class="brand"><svg width="40" height="40" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#3b6cff"/><stop offset=".52" stop-color="#ff4d55"/><stop offset="1" stop-color="#ffc400"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="#ffffff14"/><path d="M6 22 Q16 4 26 22" fill="none" stroke="url(#g)" stroke-width="3.2" stroke-linecap="round"/><circle cx="6" cy="22" r="2.6" fill="#3b6cff"/><circle cx="26" cy="22" r="2.6" fill="#ffc400"/></svg>한독 행정 브릿지</div>
<div class="bar"></div></body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 } });
const tab = await ctx.newPage();
const shot = async (file, html) => { await tab.setContent(html, { waitUntil: "load" }); await tab.evaluate(() => document.fonts.ready); await tab.screenshot({ path: root + "public/" + file }); };

await shot("og.png", page("한국 일은 독일에서,\n독일 일은 한국인의 눈으로.".replace("\n", " "), "필요 서류 → 어디서 → 얼마나 걸리는지 → 자주 하는 실수까지, 카드 한 장으로.", "KOREA ⇄ DEUTSCHLAND · 행정 가이드"));
for (const c of cards) await shot(`og/${c.id}.png`, page(c.title, c.summary, DIR[c.direction]));
await browser.close();
console.log(`og ok: ${cards.length + 1}개`);
