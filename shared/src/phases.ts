/**
 * The five phases of the 60-day roadmap.
 * Source: "Phased Software Engineering Roadmap" on the public BitElevate page.
 */
export const PHASE_IDS = ["setup", "bugs", "core", "speed", "capstone"] as const;
export type PhaseId = (typeof PHASE_IDS)[number];

export interface Phase {
  id: PhaseId;
  n: number;
  title: string;
  weeks: string;
  /** Inclusive day range within the 60-day sprint. */
  days: readonly [number, number];
  focus: string;
  summary: string;
}

export const PHASES: readonly Phase[] = [
  {
    id: "setup",
    n: 1,
    title: "Environment & Setup",
    weeks: "Week 1",
    days: [1, 7],
    focus: "Git & tooling hygiene",
    summary:
      "Fork the repo, get the local environment running, write your developer profile and open your first pull request.",
  },
  {
    id: "bugs",
    n: 2,
    title: "Bug Hunting & Tests",
    weeks: "Week 2",
    days: [8, 14],
    focus: "Root cause analysis",
    summary:
      "Reproduce real error logs, find why edge cases fail and write tests until the suite passes.",
  },
  {
    id: "core",
    n: 3,
    title: "Core Architecture",
    weeks: "Weeks 3–4",
    days: [15, 28],
    focus: "Production feature build",
    summary:
      "Build authentication, authorisation, relational schemas and clean API contracts for the core product.",
  },
  {
    id: "speed",
    n: 4,
    title: "Speed & Concurrency",
    weeks: "Weeks 5–6",
    days: [29, 42],
    focus: "Scalability & latency",
    summary:
      "Add caching, profile queries, tune indexes and handle background work and concurrent traffic.",
  },
  {
    id: "capstone",
    n: 5,
    title: "Docker & Capstone",
    weeks: "Weeks 7–8",
    days: [43, 60],
    focus: "Production graduation",
    summary:
      "Containerise the app, automate CI/CD, run a security audit and ship the capstone release.",
  },
];
