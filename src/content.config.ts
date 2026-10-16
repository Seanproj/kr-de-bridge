import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { CardSchema, ScenarioSchema } from "./schema.mjs";

export const collections = {
  cards: defineCollection({ loader: file("data/cards.json"), schema: CardSchema }),
  scenarios: defineCollection({ loader: file("data/scenarios.json"), schema: ScenarioSchema }),
};
