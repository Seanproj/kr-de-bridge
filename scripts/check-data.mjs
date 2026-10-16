// data/*.json 스키마 검사 (CI에서 PR마다 실행)
import { readFileSync } from "node:fs";
import { z } from "zod";
import { CardSchema, ScenarioSchema, ConsulateSchema, crossCheck, checkConsulates } from "../src/schema.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(`../data/${p}`, import.meta.url), "utf8"));
const cards = read("cards.json");
const scenarios = read("scenarios.json");
const consulates = read("consulates.json");
const errors = [];

for (const [name, schema, rows] of [["cards", CardSchema, cards], ["scenarios", ScenarioSchema, scenarios], ["consulates", ConsulateSchema, consulates]]) {
  const r = z.array(schema).safeParse(rows);
  if (!r.success)
    for (const i of r.error.issues) errors.push(`${name}[${i.path.join(".")}]: ${i.message}`);
}
errors.push(...crossCheck(cards, scenarios), ...checkConsulates(consulates));

if (errors.length) {
  console.error(`✗ 데이터 오류 ${errors.length}건\n` + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log(`✓ 카드 ${cards.length}개, 시나리오 ${scenarios.length}개 통과`);
