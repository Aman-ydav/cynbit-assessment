import { COVERAGE_FLOOR, INTERESTS, type InterestId } from "./interests";
import { LABS, LAB_LIST, type Lab } from "./labs";
import {
  EXPERIENCE_LABEL,
  HOURS_VALUE,
  type Experience,
} from "./options";
import { PHASES, type PhaseId } from "./phases";
import { EXPECTED_SPRINT_HOURS, PROGRAM } from "./program";
import type { Answers } from "./schemas";
import { SKILLS, type SkillId } from "./skills";
import {
  ENGINE_VERSION,
  type Alternate,
  type LabRecommendation,
  type PaceStatus,
  type Plan,
  type Readiness,
  type ReadinessBand,
  type Schedule,
  type TimelineStep,
  type UnmatchedInterest,
} from "./types";

/**
 * Path engine — deterministic, pure and free of I/O.
 *
 * Same answers → same plan, every time. There is no model call and no randomness, so results
 * are instant, explainable ("why this lab") and cheap to test. All curriculum knowledge is read
 * from the config modules (labs, interests, phases, skills, program), never hard-coded here.
 */

const WEIGHTS = { interest: 0.5, goal: 0.2, level: 0.2, skills: 0.1 } as const;

/** Used when the learner is unsure or none of their interests maps to a lab. */
const NEUTRAL_INTEREST = 0.4;

/** Highest lab level a learner can start comfortably, by experience. */
const LEVEL_CAPACITY: Record<Experience, number> = { none: 2, basics: 3, projects: 4 };

/** Score lost per level a lab sits above the learner's comfortable level. */
const LEVEL_PENALTY = 0.35;

const STRONG_COVERAGE = 0.8;
/** Skills weighted at least this much are required to start; the rest are optional. */
const CORE_WEIGHT = 0.5;
const MAX_PREP_DAYS = 28;
const MAX_REASONS = 4;
const MIN_ALTERNATE_MATCH = 40;
const MAX_ALTERNATES = 2;

const coverage = (interest: InterestId, lab: Lab): number =>
  INTERESTS[interest].coverage[lab.id] ?? 0;

const bestCoverage = (interest: InterestId): number =>
  Math.max(0, ...LAB_LIST.map((lab) => coverage(interest, lab)));

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/* ── Readiness ──────────────────────────────────────────────────────────────── */

export function computeReadiness(lab: Lab, skills: readonly SkillId[]): Readiness {
  const have = new Set(skills);
  const entries = Object.entries(lab.requires) as [SkillId, number][];

  // Core skills decide readiness and prep time; low-weight skills are only "helpful to have".
  const core = entries.filter(([, weight]) => weight >= CORE_WEIGHT);
  const total = core.reduce((sum, [, weight]) => sum + weight, 0);
  const got = core.reduce((sum, [skill, weight]) => sum + (have.has(skill) ? weight : 0), 0);
  const score = total === 0 ? 100 : Math.round((got / total) * 100);

  const owned = entries
    .filter(([skill]) => have.has(skill))
    .map(([skill]) => ({ skill, label: SKILLS[skill].label }));

  const toGap = ([skill]: [SkillId, number]) => ({
    skill,
    label: SKILLS[skill].label,
    hours: SKILLS[skill].prepHours,
    tip: SKILLS[skill].tip,
  });
  // Most important first; for equal weight, quickest to close first.
  const byPriority = (a: [SkillId, number], b: [SkillId, number]) =>
    b[1] - a[1] || SKILLS[a[0]].prepHours - SKILLS[b[0]].prepHours;

  const gaps = core
    .filter(([skill]) => !have.has(skill))
    .sort(byPriority)
    .map(toGap);
  const optionalGaps = entries
    .filter(([skill, weight]) => weight < CORE_WEIGHT && !have.has(skill))
    .sort(byPriority)
    .map(toGap);

  const band: ReadinessBand = score >= 75 ? "ready" : score >= 45 ? "short_prep" : "prep_first";
  const headline = {
    ready: "You can start Day 1 with confidence",
    short_prep: "A short prep sprint will get you ready",
    prep_first: "Start with a prep sprint before Day 1",
  }[band];

  return { score, band, headline, owned, gaps, optionalGaps };
}

/** Confidence wording for a match percentage — avoids overstating weak matches. */
export function matchLabel(matchPct: number): "Strong match" | "Good match" | "Closest fit" {
  if (matchPct >= 80) return "Strong match";
  if (matchPct >= 60) return "Good match";
  return "Closest fit";
}

/* ── Scoring ────────────────────────────────────────────────────────────────── */

function levelScore(lab: Lab, experience: Experience): number {
  const over = Math.max(0, lab.level - LEVEL_CAPACITY[experience]);
  return clamp01(1 - LEVEL_PENALTY * over);
}

interface Scored {
  lab: Lab;
  total: number;
  interest: number;
  readiness: Readiness;
}

function scoreLabs(answers: Answers, matchable: InterestId[]): Scored[] {
  const scored = LAB_LIST.map((lab) => {
    const interest =
      matchable.length === 0
        ? NEUTRAL_INTEREST
        : matchable.reduce((sum, id) => sum + coverage(id, lab), 0) / matchable.length;
    const readiness = computeReadiness(lab, answers.skills);
    const total =
      WEIGHTS.interest * clamp01(interest) +
      WEIGHTS.goal * lab.goalFit[answers.goal] +
      WEIGHTS.level * levelScore(lab, answers.experience) +
      WEIGHTS.skills * (readiness.score / 100);
    return { lab, total, interest, readiness };
  });

  // Higher score first; ties fall back to interest fit, then the fixed lab order (stable).
  return scored
    .map((s, index) => ({ s, index }))
    .sort((a, b) => b.s.total - a.s.total || b.s.interest - a.s.interest || a.index - b.index)
    .map(({ s }) => s);
}

/* ── Explanations ───────────────────────────────────────────────────────────── */

const GOAL_REASON: Partial<Record<Answers["goal"], string>> = {
  first_job: "Strong fit for landing your first tech job.",
  portfolio: "Produces a portfolio piece you can show in interviews.",
  upskill: "A strong way to deepen what you already know.",
};

function explain(lab: Lab, answers: Answers, matchable: InterestId[], readiness: Readiness) {
  const reasons: string[] = [];

  const hits = matchable
    .map((id) => ({ id, c: coverage(id, lab) }))
    .filter((hit) => hit.c >= COVERAGE_FLOOR)
    .sort((a, b) => b.c - a.c);
  for (const hit of hits.slice(0, 2)) {
    const label = INTERESTS[hit.id].label;
    reasons.push(
      hit.c >= STRONG_COVERAGE
        ? `You're interested in ${label} — this lab is built around it.`
        : `You're interested in ${label} — this lab covers part of it.`,
    );
  }

  const diff = lab.level - LEVEL_CAPACITY[answers.experience];
  if (diff <= -2) reasons.push("Well within your experience, so you can focus on going deep.");
  else if (diff <= 0)
    reasons.push(`Matches your experience (${EXPERIENCE_LABEL[answers.experience]}).`);
  else if (diff === 1)
    reasons.push("A stretch for your current level — a short prep sprint will help.");
  else reasons.push("A big stretch for your current level — plan a longer prep sprint first.");

  const goalReason = lab.goalFit[answers.goal] >= STRONG_COVERAGE && GOAL_REASON[answers.goal];
  if (goalReason) reasons.push(goalReason);

  const coreOwned = readiness.owned.filter(({ skill }) => (lab.requires[skill] ?? 0) >= CORE_WEIGHT);
  const coreCount = Object.values(lab.requires).filter((weight) => weight >= CORE_WEIGHT).length;
  if (coreOwned.length >= 1 && readiness.score >= 50) {
    reasons.push(
      `You already have ${coreOwned.length} of the ${coreCount} core skills this lab builds on.`,
    );
  }

  return reasons.slice(0, MAX_REASONS);
}

/* ── Schedule & timeline ────────────────────────────────────────────────────── */

const PACE: Record<Answers["hoursPerDay"], { status: PaceStatus; message: string }> = {
  lt1: {
    status: "tight",
    message:
      "Under 1 hour a day is below the 1.5–2 hours BitElevate expects. Consider starting when your schedule is lighter, or plan weekend catch-up.",
  },
  h1_5_2: {
    status: "on_track",
    message: "1.5–2 hours a day matches what BitElevate expects.",
  },
  gt2: {
    status: "ahead",
    message:
      "You have more time than the program needs — use the extra for stretch goals like extra tests or an open-source pull request.",
  },
};

function buildSchedule(answers: Answers, readiness: Readiness): Schedule {
  const hoursPerDay = HOURS_VALUE[answers.hoursPerDay];
  const prepHours = readiness.gaps.reduce((sum, gap) => sum + gap.hours, 0);
  const rawPrepDays = prepHours === 0 ? 0 : Math.max(1, Math.ceil(prepHours / hoursPerDay));
  const prepDays = Math.min(rawPrepDays, MAX_PREP_DAYS);
  const freezeDays = answers.examsSoon ? PROGRAM.examFreezeDays : 0;
  const totalCalendarDays = prepDays + PROGRAM.durationDays + freezeDays;

  return {
    prepDays,
    prepCapped: rawPrepDays > MAX_PREP_DAYS,
    prepHours,
    sprintDays: PROGRAM.durationDays,
    freezeDays,
    totalCalendarDays,
    totalCalendarWeeks: Math.ceil(totalCalendarDays / 7),
    hoursPerDay,
    expectedSprintHours: [...EXPECTED_SPRINT_HOURS],
    pace: PACE[answers.hoursPerDay],
  };
}

const CAPSTONE_TIP: Record<Answers["goal"], string> = {
  credit: "Keep your certificate and capstone link ready for your college training letter and NOC.",
  first_job: "Turn the capstone repository into a résumé project and a two-minute interview story.",
  portfolio: "Polish the README, add a demo and pin the repository to your GitHub profile.",
  upskill: "Extend the capstone with one stretch feature that goes beyond the brief.",
};

function phaseTips(phase: PhaseId, lab: Lab, answers: Answers): string[] {
  switch (phase) {
    case "setup":
      if (answers.experience === "none")
        return [
          "Budget the full week — Git and the local setup are the biggest first hurdle, so ask mentors early.",
        ];
      if (answers.experience === "projects")
        return [
          "You may finish setup in 2–3 days — open your first PR early and use the spare time to read the codebase.",
        ];
      return [];
    case "bugs":
      return !answers.skills.includes("testing_basics") && lab.id !== "uiux_design"
        ? ["You'll pick up testing here: write one failing test per bug, then make it pass."]
        : [];
    case "core":
      return answers.hoursPerDay === "lt1"
        ? ["This is the heaviest phase — protect your daily slot or plan weekend catch-up."]
        : [];
    case "capstone":
      return [CAPSTONE_TIP[answers.goal]];
    default:
      return [];
  }
}

function buildTimeline(lab: Lab, answers: Answers, readiness: Readiness, schedule: Schedule) {
  const steps: TimelineStep[] = [];

  if (schedule.prepDays > 0) {
    steps.push({
      id: "prep",
      kind: "prep",
      title: "Pre-sprint prep",
      period: `Before Day 1 · about ${schedule.prepDays} day${schedule.prepDays === 1 ? "" : "s"}`,
      focus: "Close the gaps",
      summary: `About ${schedule.prepHours} hours of focused practice across ${readiness.gaps.length} skill${
        readiness.gaps.length === 1 ? "" : "s"
      }, so Day 1 feels like a warm-up.`,
      items: [
        ...readiness.gaps.map((gap) => `${gap.label} (~${gap.hours} h): ${gap.tip}`),
        ...readiness.optionalGaps.map(
          (gap) => `Optional — ${gap.label} (~${gap.hours} h): ${gap.tip}`,
        ),
      ],
    });
  }

  for (const phase of PHASES) {
    steps.push({
      id: phase.id,
      kind: "phase",
      title: `Phase ${phase.n} · ${phase.title}`,
      period: `${phase.weeks} · Days ${phase.days[0]}–${phase.days[1]}`,
      dayRange: [phase.days[0], phase.days[1]],
      focus: phase.focus,
      summary: phase.summary,
      labFocus: lab.phaseFocus[phase.id],
      items: phaseTips(phase.id, lab, answers),
    });
  }

  return steps;
}

/* ── Notes, unmatched interests ─────────────────────────────────────────────── */

function buildUnmatched(interests: InterestId[]): UnmatchedInterest[] {
  return interests
    .filter((id) => bestCoverage(id) < COVERAGE_FLOOR)
    .map((id) => {
      const interest = INTERESTS[id];
      const closest = LAB_LIST.map((lab) => ({ lab, c: coverage(id, lab) }))
        .filter((entry) => entry.c > 0)
        .sort((a, b) => b.c - a.c)[0];
      const message = closest
        ? `There's no dedicated lab for ${interest.label} yet — the closest is the ${closest.lab.shortName} Lab.${
            interest.note ? ` ${interest.note}` : ""
          }`
        : `No BitElevate lab covers ${interest.label} yet. We've noted your interest.`;
      return { id, label: interest.label, message, closestLab: closest?.lab.id };
    });
}

function buildNotes(
  answers: Answers,
  matchable: InterestId[],
  primary: Lab,
  alternates: Alternate[],
): string[] {
  const notes: string[] = [];

  // Be upfront when the best interest match is a big stretch, and offer a gentler start.
  if (primary.level - LEVEL_CAPACITY[answers.experience] >= 2) {
    const gentler = alternates
      .map((alt) => LABS[alt.labId])
      .filter((candidate) => candidate.level < primary.level)
      .sort((a, b) => a.level - b.level)[0];
    if (gentler) {
      notes.push(
        `The ${primary.shortName} Lab is one of the more advanced labs. If you'd rather build confidence first, the ${gentler.shortName} Lab is a gentler start.`,
      );
    }
  }

  if (answers.interests.length === 0) {
    notes.push(
      "You weren't sure what to pick, so we matched mainly on your goal and experience. Retake the quiz after you've explored a few topics.",
    );
  } else if (matchable.length === 0) {
    notes.push(
      "None of your chosen topics has a dedicated lab yet, so we matched on your goal and experience instead.",
    );
  }
  if (answers.examsSoon) {
    notes.push(
      `Exams in the next 60 days? BitElevate lets you request a freeze of up to ${PROGRAM.examFreezeDays} days through the intern portal — request it before your exam window.`,
    );
  }
  if (answers.stage === "final_year") {
    notes.push(
      "As a final-year student, check your college's deadline for the training letter and NOC before choosing a start date.",
    );
  }
  if (answers.stage === "year1") {
    notes.push(
      "You're early — there's no rush. Start when your semester is lighter; the prep tasks are a good way to warm up in the meantime.",
    );
  }
  return notes;
}

/* ── Public API ─────────────────────────────────────────────────────────────── */

export function generatePlan(answers: Answers): Plan {
  const matchable = answers.interests.filter((id) => bestCoverage(id) >= COVERAGE_FLOOR);
  const ranked = scoreLabs(answers, matchable);
  const [top, ...rest] = ranked;
  if (!top) throw new Error("No labs configured");

  const primary: LabRecommendation = {
    labId: top.lab.id,
    matchPct: Math.round(clamp01(top.total) * 100),
    reasons: explain(top.lab, answers, matchable, top.readiness),
  };

  const alternates: Alternate[] = rest
    .map((s) => ({
      labId: s.lab.id,
      matchPct: Math.round(clamp01(s.total) * 100),
      reasons: explain(s.lab, answers, matchable, s.readiness).slice(0, 2),
      chooseIf: s.lab.chooseIf,
    }))
    .filter((alt) => alt.matchPct >= MIN_ALTERNATE_MATCH)
    .slice(0, MAX_ALTERNATES);

  const lab = LABS[primary.labId];
  const readiness = top.readiness;
  const schedule = buildSchedule(answers, readiness);

  return {
    engineVersion: ENGINE_VERSION,
    answers,
    primary,
    alternates,
    readiness,
    schedule,
    timeline: buildTimeline(lab, answers, readiness, schedule),
    outcomes: [...new Set([...lab.outcomes, ...PROGRAM.outcomes])],
    unmatched: buildUnmatched(answers.interests),
    notes: buildNotes(answers, matchable, lab, alternates),
    enrol: { labId: lab.id, priceInr: PROGRAM.priceInr, listPriceInr: PROGRAM.listPriceInr },
  };
}
