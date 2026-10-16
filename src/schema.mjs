// 카드·시나리오 데이터 스키마 — Astro content collection과 scripts/check-data.mjs가 함께 쓴다.
import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 해요");

export const SourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  type: z.enum(["official", "secondary"]),
});

export const CardSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case id"),
    title: z.string().min(1),
    summary: z.string().min(1),
    category: z.enum(["documents", "finance", "pension-insurance", "driving", "residence", "family", "public"]),
    direction: z.enum(["KR→DE", "DE→KR", "DE", "KR"]),
    methods: z.array(z.enum(["online", "visit", "appointment", "mail"])).min(1),
    audience: z.string(),
    steps: z.array(z.object({ title: z.string(), detail: z.string() })).min(1),
    documents: z.array(z.string()),
    where: z.array(z.object({
      name: z.string(),
      url: z.string().url().optional(),
      note: z.string().optional(),
      finder: z.literal("consulate").optional(), // 카드에 '내 주 → 관할 공관' 찾기 표시
    }).strict()),
    duration: z.string(),
    cost: z.string(),
    mistakes: z.array(z.string()),
    sources: z.array(SourceSchema),
    verification: z.object({
      status: z.enum(["verified", "partial", "draft"]),
      checkedAt: date.nullable(),
      toVerify: z.array(z.string()),
    }),
    experience: z.array(z.object({ title: z.string(), author: z.string(), url: z.string().url(), summary: z.string() })),
    related: z.array(z.string()),
    updatedAt: date,
  })
  .strict()
  .superRefine((c, ctx) => {
    // SPEC 6장 규칙: verified는 확인일과 공식 출처가 있어야 한다.
    if (c.verification.status === "verified") {
      if (!c.verification.checkedAt)
        ctx.addIssue({ code: "custom", message: "verified 카드는 checkedAt이 필요해요", path: ["verification", "checkedAt"] });
      if (!c.sources.some((s) => s.type === "official"))
        ctx.addIssue({ code: "custom", message: "verified 카드는 official 출처가 1개 이상 필요해요", path: ["sources"] });
    }
  });

export const ScenarioSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    title: z.string(),
    icon: z.string(),
    description: z.string(),
    steps: z.array(z.object({ cardId: z.string(), why: z.string() })).min(1),
  })
  .strict();

export const STATES = [
  "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hessen", "Mecklenburg-Vorpommern",
  "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen",
];

export const ConsulateSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    city: z.string(),
    url: z.string().url(),
    states: z.array(z.enum(STATES)).min(1),
  })
  .strict();

/** 16개 주가 공관 하나에 정확히 한 번씩 배정됐는지 */
export function checkConsulates(list) {
  const seen = list.flatMap((c) => c.states);
  const errors = [];
  for (const st of STATES) {
    const n = seen.filter((x) => x === st).length;
    if (n !== 1) errors.push(`공관 관할: ${st}가 ${n}번 배정됨`);
  }
  return errors;
}

/** 카드 간 참조(related, scenario.steps)가 실제 존재하는지 확인 */
export function crossCheck(cards, scenarios) {
  const ids = new Set(cards.map((c) => c.id));
  const errors = [];
  if (ids.size !== cards.length) errors.push("중복된 카드 id가 있어요");
  for (const c of cards)
    for (const r of c.related) if (!ids.has(r)) errors.push(`카드 ${c.id}: related에 없는 id "${r}"`);
  for (const s of scenarios)
    for (const st of s.steps) if (!ids.has(st.cardId)) errors.push(`시나리오 ${s.id}: 없는 카드 "${st.cardId}"`);
  return errors;
}
