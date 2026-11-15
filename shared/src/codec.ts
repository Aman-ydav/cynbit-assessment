import { generatePlan } from "./engine";
import { INTEREST_IDS, MAX_INTERESTS } from "./interests";
import { DAILY_HOURS, EXPERIENCE_LEVELS, GOALS, STAGES } from "./options";
import { answersSchema, type Answers } from "./schemas";
import { SKILL_IDS } from "./skills";
import type { Plan } from "./types";

/**
 * Stateless plan codes.
 *
 * A plan is a pure function of the learner's answers, so a share link only needs to carry the
 * answers — no database lookup, no personal data, and links keep working even if storage is down.
 * Answers are packed as a tuple of enum indices, JSON-encoded and base64url-encoded (~40 chars).
 */
const CODEC_VERSION = 1;
const MAX_CODE_LENGTH = 200;

const toBase64Url = (text: string) =>
  btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (code: string) => {
  const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
};

export function encodeAnswers(answers: Answers): string {
  const tuple = [
    CODEC_VERSION,
    STAGES.indexOf(answers.stage),
    EXPERIENCE_LEVELS.indexOf(answers.experience),
    GOALS.indexOf(answers.goal),
    answers.interests.map((id) => INTEREST_IDS.indexOf(id)),
    DAILY_HOURS.indexOf(answers.hoursPerDay),
    answers.examsSoon ? 1 : 0,
    answers.skills.map((id) => SKILL_IDS.indexOf(id)),
  ];
  return toBase64Url(JSON.stringify(tuple));
}

/** Returns the answers for a valid code, or `null` for anything malformed or tampered with. */
export function decodeAnswers(code: string): Answers | null {
  try {
    if (!code || code.length > MAX_CODE_LENGTH || !/^[A-Za-z0-9_-]+$/.test(code)) return null;

    const tuple: unknown = JSON.parse(fromBase64Url(code));
    if (!Array.isArray(tuple) || tuple.length !== 8 || tuple[0] !== CODEC_VERSION) return null;

    const [, stage, experience, goal, interests, hours, exams, skills] = tuple;
    if (!Array.isArray(interests) || !Array.isArray(skills)) return null;
    if (interests.length > MAX_INTERESTS || skills.length > SKILL_IDS.length) return null;
    if (exams !== 0 && exams !== 1) return null;

    // Enum lookups yield `undefined` for bad indices, which the schema then rejects.
    const parsed = answersSchema.safeParse({
      stage: STAGES[stage],
      experience: EXPERIENCE_LEVELS[experience],
      goal: GOALS[goal],
      interests: interests.map((index) => INTEREST_IDS[index]),
      hoursPerDay: DAILY_HOURS[hours],
      examsSoon: exams === 1,
      skills: skills.map((index) => SKILL_IDS[index]),
    });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Decode a share code and regenerate the plan. `null` if the code isn't valid. */
export function planFromCode(code: string): Plan | null {
  const answers = decodeAnswers(code);
  return answers ? generatePlan(answers) : null;
}
