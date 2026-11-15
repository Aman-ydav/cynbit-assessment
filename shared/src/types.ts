import type { Answers } from "./schemas";
import type { InterestId } from "./interests";
import type { LabId } from "./labs";
import type { PhaseId } from "./phases";
import type { SkillId } from "./skills";

/** Bump when matching rules or plan structure change, so stored plans can be told apart. */
export const ENGINE_VERSION = 1;

export type ReadinessBand = "ready" | "short_prep" | "prep_first";

export interface LabRecommendation {
  labId: LabId;
  /** 0–100 match strength. A guide to relative fit, not a probability of success. */
  matchPct: number;
  /** Short, human-readable reasons — the "why" behind the recommendation. */
  reasons: string[];
}

export interface Alternate extends LabRecommendation {
  chooseIf: string;
}

export interface SkillGap {
  skill: SkillId;
  label: string;
  hours: number;
  tip: string;
}

export interface Readiness {
  /** 0–100: share of the lab's weighted prerequisites the learner already has. */
  score: number;
  band: ReadinessBand;
  headline: string;
  owned: { skill: SkillId; label: string }[];
  gaps: SkillGap[];
}

export type PaceStatus = "tight" | "on_track" | "ahead";

export interface Schedule {
  prepDays: number;
  /** True when the prep estimate was capped, i.e. it would take longer than shown. */
  prepCapped: boolean;
  prepHours: number;
  sprintDays: number;
  freezeDays: number;
  totalCalendarDays: number;
  totalCalendarWeeks: number;
  hoursPerDay: number;
  expectedSprintHours: [number, number];
  pace: { status: PaceStatus; message: string };
}

export interface TimelineStep {
  id: "prep" | PhaseId;
  kind: "prep" | "phase";
  title: string;
  /** e.g. "Weeks 3–4 · Days 15–28". */
  period: string;
  dayRange?: [number, number];
  focus: string;
  summary: string;
  /** What this phase looks like in the recommended lab. */
  labFocus?: string;
  /** Personalised tips for this learner in this phase. */
  items: string[];
}

export interface UnmatchedInterest {
  id: InterestId;
  label: string;
  message: string;
  closestLab?: LabId;
}

export interface Plan {
  engineVersion: number;
  answers: Answers;
  primary: LabRecommendation;
  alternates: Alternate[];
  readiness: Readiness;
  schedule: Schedule;
  timeline: TimelineStep[];
  outcomes: string[];
  unmatched: UnmatchedInterest[];
  notes: string[];
  enrol: { labId: LabId; priceInr: number; listPriceInr: number };
}
