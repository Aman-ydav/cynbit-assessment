import { INTEREST_IDS, MAX_INTERESTS } from "./interests";
import { DAILY_HOURS, EXPERIENCE_LEVELS, GOALS, STAGES } from "./options";
import type { Answers } from "./schemas";
import { SKILL_IDS } from "./skills";

/** Small seeded PRNG (mulberry32) so property-style tests are reproducible. */
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)] as T;
}

function sample<T>(items: readonly T[], count: number, rand: () => number): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0] as T);
  }
  return out;
}

export function randomAnswers(rand: () => number): Answers {
  return {
    stage: pick(STAGES, rand),
    experience: pick(EXPERIENCE_LEVELS, rand),
    goal: pick(GOALS, rand),
    interests: sample(INTEREST_IDS, Math.floor(rand() * (MAX_INTERESTS + 1)), rand),
    hoursPerDay: pick(DAILY_HOURS, rand),
    examsSoon: rand() < 0.5,
    skills: sample(SKILL_IDS, Math.floor(rand() * (SKILL_IDS.length + 1)), rand),
  };
}

/** Convenience: build answers with sensible defaults, overriding only what a test cares about. */
export function answers(overrides: Partial<Answers> = {}): Answers {
  return {
    stage: "year3",
    experience: "basics",
    goal: "first_job",
    interests: [],
    hoursPerDay: "h1_5_2",
    examsSoon: false,
    skills: [],
    ...overrides,
  };
}
