import { INTEREST_IDS } from "./interests";
import { DAILY_HOURS, EXPERIENCE_LEVELS, GOALS, STAGES } from "./options";
import type { Answers } from "./schemas";
import { SKILL_IDS } from "./skills";

/**
 * Encoding half of the plan code (see codec.ts for the format and the strict decoder).
 * Kept in its own module, with no validation-library import, so browsers that only need to
 * *create* a link (e.g. the landing page's sample plan) don't download the schema code.
 */
export const CODEC_VERSION = 1;

export const toBase64Url = (text: string) =>
  btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

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
