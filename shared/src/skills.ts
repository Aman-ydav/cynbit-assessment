/**
 * Self-check skills used to estimate readiness for a lab.
 * `prepHours` are rough estimates of focused practice needed to reach "can follow along";
 * they are assumptions for the prototype and are meant to be reviewed by Cynbit's mentors.
 */
export const SKILL_IDS = [
  "git",
  "web_basics",
  "react",
  "python",
  "sql",
  "testing_basics",
  "design_basics",
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export interface SkillInfo {
  label: string;
  /** Short phrase used in the self-check step. */
  hint: string;
  prepHours: number;
  /** A concrete way to close the gap. */
  tip: string;
}

export const SKILLS: Record<SkillId, SkillInfo> = {
  git: {
    label: "Git & GitHub basics",
    hint: "Clone, branch, commit, open a pull request",
    prepHours: 6,
    tip: "Practise clone → branch → commit → pull request on a small practice repo.",
  },
  web_basics: {
    label: "HTML, CSS & JavaScript",
    hint: "Built a small interactive web page",
    prepHours: 20,
    tip: "Build one responsive page with a small interactive feature, without a framework.",
  },
  react: {
    label: "React fundamentals",
    hint: "Components, props, state",
    prepHours: 15,
    tip: "Rebuild a small app (to-do list or weather widget) using components and state.",
  },
  python: {
    label: "Python fundamentals",
    hint: "Functions, classes, files, packages",
    prepHours: 20,
    tip: "Write a small command-line tool that reads a file and prints a summary.",
  },
  sql: {
    label: "SQL basics",
    hint: "SELECT, JOIN, simple schemas",
    prepHours: 8,
    tip: "Create a two-table schema and practise SELECT, JOIN and GROUP BY queries.",
  },
  testing_basics: {
    label: "Testing basics",
    hint: "Written a unit test before",
    prepHours: 6,
    tip: "Add three unit tests to any small project and make them pass.",
  },
  design_basics: {
    label: "Design basics (Figma, wireframes)",
    hint: "Sketched screens or used Figma",
    prepHours: 12,
    tip: "Redesign one screen of an app you use as a wireframe, then as a clickable prototype.",
  },
};
