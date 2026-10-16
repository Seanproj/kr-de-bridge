import { getCollection } from "astro:content";
import { crossCheck, checkConsulates, ConsulateSchema } from "../schema.mjs";
import consulates from "../../data/consulates.json";
import type { z } from "zod";
import type { CardSchema, ScenarioSchema } from "../schema.mjs";

export type Card = z.infer<typeof CardSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;

let cache: { cards: Card[]; scenarios: Scenario[] } | undefined;

export async function loadData() {
  if (cache) return cache;
  const cards = (await getCollection("cards")).map((e) => e.data as Card);
  const scenarios = (await getCollection("scenarios")).map((e) => e.data as Scenario);
  const errors = [...crossCheck(cards, scenarios), ...checkConsulates(consulates)];
  for (const c of consulates) ConsulateSchema.parse(c);
  if (errors.length) throw new Error("데이터 참조 오류:\n" + errors.join("\n"));
  cache = { cards, scenarios };
  return cache;
}

export const CATEGORIES = {
  documents: { label: "서류·공증", icon: "📄" },
  finance: { label: "금융·세금", icon: "💶" },
  "pension-insurance": { label: "연금·보험", icon: "🛡️" },
  driving: { label: "운전·이동", icon: "🚗" },
  residence: { label: "체류·주민", icon: "🏡" },
  family: { label: "가족", icon: "👨‍👩‍👧" },
  public: { label: "공공·기타", icon: "🏛️" },
} as const satisfies Record<Card["category"], { label: string; icon: string }>;

export const DIRECTIONS = {
  "KR→DE": { label: "한국 → 독일", flags: "🇰🇷→🇩🇪", tone: "bridge" },
  "DE→KR": { label: "독일 → 한국", flags: "🇩🇪→🇰🇷", tone: "bridge" },
  DE: { label: "독일 현지", flags: "🇩🇪", tone: "de" },
  KR: { label: "한국 업무", flags: "🇰🇷", tone: "kr" },
} as const satisfies Record<Card["direction"], { label: string; flags: string; tone: string }>;

export const METHODS = {
  online: { label: "온라인 가능", icon: "🌐" },
  visit: { label: "방문 필요", icon: "🚶" },
  appointment: { label: "예약 필요", icon: "📅" },
  mail: { label: "우편 가능", icon: "✉️" },
} as const satisfies Record<Card["methods"][number], { label: string; icon: string }>;

export const STATUS = {
  verified: { label: "확인됨", tone: "ok" },
  partial: { label: "일부 확인", tone: "warn" },
  draft: { label: "초안 — 확인 필요", tone: "draft" },
} as const;

export const STALE_DAYS = 180;

export function daysSince(date: string, now = new Date()) {
  return Math.floor((now.getTime() - new Date(date + "T00:00:00Z").getTime()) / 86_400_000);
}

/** BASE_URL을 고려한 내부 링크 */
export function href(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return base + (path.startsWith("/") ? path : "/" + path);
}

export const REPO = "Seanproj/kr-de-bridge";
export function reportUrl(cardId?: string) {
  const p = new URLSearchParams({ template: "report.yml", title: cardId ? `[제보] ${cardId}` : "[제보] " });
  if (cardId) p.set("card", cardId);
  return `https://github.com/${REPO}/issues/new?${p}`;
}
