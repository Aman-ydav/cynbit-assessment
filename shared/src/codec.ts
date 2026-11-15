import { CODEC_VERSION } from "./encode";
import { generatePlan } from "./engine";
import { INTEREST_IDS, MAX_INTERESTS } from "./interests";
import { DAILY_HOURS, EXPERIENCE_LEVELS, GOALS, STAGES } from "./options";
import type { Answers } from "./schemas";
import { SKILL_IDS } from "./skills";
import type { Plan } from "./types";

/**
 * Stateless plan codes.
 *
 * A plan is a pure function of the learner's answers, so a share link only needs to carry the
 * answers — no database lookup, no personal data, and links keep working even if storage is down.
 * Answers are packed as a tuple of enum indices, JSON-encoded and base64url-encoded (~40 chars).
 *
 * Encoding lives in encode.ts (no validation dependency); this module adds the strict decoder.
 */
export { encodeAnswers } from "./encode";

const MAX_CODE_LENGTH = 200;

const fromBase64Url = (code: string) => {
  const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
};

/**
 * Strict index lookup. Plain `list[index]` would also accept numeric strings ("0") and other
 * coercible keys, letting two different codes decode to the same answers.
 */
function lookup<T>(list: readonly T[], index: unknown): T | undefined {
  return typeof index === "number" && Number.isInteger(index) ? list[index] : undefined;
}

const isAllDefined = <T>(items: (T | undefined)[]): items is T[] => items.every((item) => item !== undefined);
const isUnique = <T>(items: readonly T[]) => new Set(items).size === items.length;

/** Returns the answers for a valid code, or `null` for anything malformed or tampered with. */
export function decodeAnswers(code: string): Answers | null {
  try {
    if (!code || code.length > MAX_CODE_LENGTH || !/^[A-Za-z0-9_-]+$/.test(code)) return null;

    const tuple: unknown = JSON.parse(fromBase64Url(code));
    if (!Array.isArray(tuple) || tuple.length !== 8 || tuple[0] !== CODEC_VERSION) return null;

    const [, stageIdx, experienceIdx, goalIdx, interestIdx, hoursIdx, exams, skillIdx] = tuple;
    if (!Array.isArray(interestIdx) || !Array.isArray(skillIdx)) return null;
    if (interestIdx.length > MAX_INTERESTS || skillIdx.length > SKILL_IDS.length) return null;
    if (exams !== 0 && exams !== 1) return null;

    // Validated by hand (rather than with the zod schema) so that opening a shared plan doesn't
    // download a validation library. A fuzz test asserts this accepts only what answersSchema accepts.
    const stage = lookup(STAGES, stageIdx);
    const experience = lookup(EXPERIENCE_LEVELS, experienceIdx);
    const goal = lookup(GOALS, goalIdx);
    const hoursPerDay = lookup(DAILY_HOURS, hoursIdx);
    const interests = interestIdx.map((index) => lookup(INTEREST_IDS, index));
    const skills = skillIdx.map((index) => lookup(SKILL_IDS, index));

    if (!stage || !experience || !goal || !hoursPerDay) return null;
    if (!isAllDefined(interests) || !isAllDefined(skills)) return null;
    if (!isUnique(interests) || !isUnique(skills)) return null;

    return { stage, experience, goal, interests, hoursPerDay, examsSoon: exams === 1, skills };
  } catch {
    return null;
  }
}

/** Decode a share code and regenerate the plan. `null` if the code isn't valid. */
export function planFromCode(code: string): Plan | null {
  const answers = decodeAnswers(code);
  return answers ? generatePlan(answers) : null;
}
