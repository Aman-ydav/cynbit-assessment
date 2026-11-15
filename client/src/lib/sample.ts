import { encodeAnswers, generatePlan, type Answers } from "@bitelevate/shared";

/**
 * A representative learner used for the landing-page preview and the "See a sample plan" link.
 * The preview is produced by the real engine, so it can never drift from what users actually get.
 */
export const SAMPLE_ANSWERS: Answers = {
  stage: "year3",
  experience: "basics",
  goal: "first_job",
  interests: ["full_stack_web"],
  hoursPerDay: "h1_5_2",
  examsSoon: false,
  skills: ["git", "web_basics", "python"],
};

export const SAMPLE_PLAN = generatePlan(SAMPLE_ANSWERS);
export const SAMPLE_CODE = encodeAnswers(SAMPLE_ANSWERS);
