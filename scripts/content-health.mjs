// 월간 콘텐츠 점검: 깨진 출처 링크 + checkedAt 180일 경과/미확인 카드 → Markdown 리포트(stdout)
import { readFileSync } from "node:fs";
const cards = JSON.parse(readFileSync(new URL("../data/cards.json", import.meta.url), "utf8"));
const STALE = 180;
const today = new Date();

const urls = new Map();
for (const c of cards) {
  for (const s of c.sources) (urls.get(s.url) ?? urls.set(s.url, []).get(s.url)).push(c.id);
  for (const w of c.where) if (w.url) (urls.get(w.url) ?? urls.set(w.url, []).get(w.url)).push(c.id);
}

async function check(url) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const r = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "user-agent": "Mozilla/5.0 kr-de-bridge link-check" } });
      if (r.ok) return null;
      if (method === "GET") return `HTTP ${r.status}`;
    } catch (e) {
      if (method === "GET") return e.name === "TimeoutError" ? "시간 초과" : String(e.cause?.code ?? e.message);
    }
  }
}

const broken = [];
await Promise.all([...urls].map(async ([u, ids]) => { const err = await check(u); if (err) broken.push({ u, ids: [...new Set(ids)], err }); }));

const stale = cards.filter((c) => c.verification.checkedAt && (today - new Date(c.verification.checkedAt)) / 864e5 >= STALE);
const unchecked = cards.filter((c) => !c.verification.checkedAt);

const out = [`# 콘텐츠 점검 리포트 (${today.toISOString().slice(0, 10)})`, ""];
out.push(`## 깨진 링크 ${broken.length}건`, ...(broken.length ? broken.map((b) => `- [ ] ${b.u} — ${b.err} (카드: ${b.ids.join(", ")})`) : ["없음"]), "");
out.push(`## 확인 후 ${STALE}일 경과 ${stale.length}건`, ...(stale.length ? stale.map((c) => `- [ ] \`${c.id}\` — 확인일 ${c.verification.checkedAt}`) : ["없음"]), "");
out.push(`## 아직 출처 대조 전 ${unchecked.length}건`, ...unchecked.map((c) => `- \`${c.id}\` (${c.verification.status})`), "");
if (!broken.length && !stale.length) out.unshift("문제 없음 (대조 전 카드 목록만 참고)\n");
console.log(out.join("\n"));
