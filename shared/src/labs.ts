import type { Goal } from "./options";
import type { PhaseId } from "./phases";
import type { SkillId } from "./skills";

/**
 * The six BitElevate labs.
 *
 * Provenance: lab names, project names and headline stacks come from the public BitElevate page
 * (15 Nov 2026). Items marked `inferred` (stack details, per-phase focus, ship lists, skill
 * requirements and goal-fit weights) are the prototype author's reasoned assumptions derived
 * from the public phase descriptions and testimonials. They are deliberately kept in this one
 * file so Cynbit's mentors can review and correct them without touching any logic.
 */
export const LAB_IDS = [
  "fullstack",
  "python_backend",
  "ai_vector",
  "frontend_ops",
  "qa_automation",
  "uiux_design",
] as const;

export type LabId = (typeof LAB_IDS)[number];

export type LabLevel = 1 | 2 | 3 | 4;

export const LEVEL_LABEL: Record<LabLevel, string> = {
  1: "Beginner-friendly",
  2: "Some coding helps",
  3: "Comfortable with code",
  4: "Stretch / advanced",
};

export interface Lab {
  id: LabId;
  name: string;
  shortName: string;
  project: string;
  tagline: string;
  summary: string;
  level: LabLevel;
  stack: readonly string[];
  /** Skill → weight. Weights express how much each skill matters for this lab. (inferred) */
  requires: Partial<Record<SkillId, number>>;
  /** How well the lab serves each goal, 0–1. (inferred) */
  goalFit: Record<Goal, number>;
  /** Concrete things the learner ships. (inferred) */
  ships: readonly string[];
  outcomes: readonly string[];
  /** One sentence used to help choose between this lab and a runner-up. */
  chooseIf: string;
  /** What each phase looks like in this lab. (inferred) */
  phaseFocus: Record<PhaseId, string>;
}

export const LABS: Record<LabId, Lab> = {
  fullstack: {
    id: "fullstack",
    name: "Full Stack SaaS Lab",
    shortName: "Full Stack",
    project: "SprintPulse",
    tagline: "Ship a Kanban SaaS end to end",
    summary:
      "Build a Trello/Linear-style Kanban SaaS: drag-and-drop state machines, JWT auth, real-time board updates, database migrations and a Dockerised deployment.",
    level: 3,
    stack: ["Next.js 15", "React 19", "FastAPI", "PostgreSQL", "Tailwind CSS", "Docker"],
    requires: { git: 1, web_basics: 1, python: 1, sql: 0.5, react: 0.5 },
    goalFit: { credit: 0.6, first_job: 0.9, portfolio: 0.8, upskill: 0.6 },
    ships: [
      "A drag-and-drop Kanban board driven by an explicit state machine",
      "JWT authentication with role-based access",
      "A Dockerised, CI-tested release of the whole stack",
    ],
    outcomes: [
      "A production-style full-stack repository on your GitHub",
      "Interview talking points on auth, data modelling and deployment",
    ],
    chooseIf:
      "You want to say you built and shipped a complete product — frontend, API and database.",
    phaseFocus: {
      setup: "Fork the SprintPulse repo, run Next.js + FastAPI + Postgres locally and open your first PR.",
      bugs: "Reproduce real board bugs from error logs and lock each fix in with a test.",
      core: "Build JWT auth, RBAC and the board's drag-and-drop state machine on a relational schema.",
      speed: "Add real-time board updates, caching and query tuning for concurrent users.",
      capstone: "Dockerise the stack, wire GitHub Actions CI/CD and ship the capstone release.",
    },
  },
  python_backend: {
    id: "python_backend",
    name: "Python Backend Lab",
    shortName: "Python Backend",
    project: "PulseServe API",
    tagline: "Build and harden a production-style API",
    summary:
      "Design a Python API with JWT/RBAC, relational schemas, Redis caching and background jobs, then containerise it with CI/CD.",
    level: 3,
    stack: ["Python", "FastAPI", "PostgreSQL", "Redis", "Celery", "Docker"],
    requires: { git: 1, python: 1.5, sql: 1 },
    goalFit: { credit: 0.6, first_job: 0.85, portfolio: 0.6, upskill: 0.7 },
    ships: [
      "Authenticated, role-aware endpoints with clean router contracts",
      "A Redis caching layer plus query and index tuning",
      "Celery background jobs and a multi-stage Docker build",
    ],
    outcomes: [
      "A backend portfolio piece with tests and a CI pipeline",
      "Confident answers on caching, indexing and concurrency",
    ],
    chooseIf: "You enjoy logic, data and APIs more than screens and want a path to backend roles.",
    phaseFocus: {
      setup: "Set up your Python environment, run PulseServe locally and open your first PR.",
      bugs: "Trace production-style error logs to the root cause and lock fixes in with Pytest.",
      core: "Design JWT/RBAC-protected endpoints and relational schemas with clean router contracts.",
      speed: "Add Redis caching, tune indexes and move slow work to Celery background jobs.",
      capstone: "Containerise with multi-stage Docker, automate CI/CD and complete a security audit.",
    },
  },
  ai_vector: {
    id: "ai_vector",
    name: "AI & Vector Intelligence Lab",
    shortName: "AI & Vector",
    project: "SupportPulse AI",
    tagline: "Build the engineering behind AI features",
    summary:
      "Work on an AI support assistant: chunking strategies, vector-database latency, rate limits and the engineering around LLM calls.",
    level: 4,
    stack: ["Python", "FastAPI", "Vector database", "LLM APIs", "Docker"],
    requires: { git: 1, python: 1.5, sql: 0.5 },
    goalFit: { credit: 0.5, first_job: 0.6, portfolio: 0.8, upskill: 0.8 },
    ships: [
      "A document ingestion and chunking pipeline",
      "A retrieval API that handles latency and rate limits",
      "A containerised, CI-tested assistant release",
    ],
    outcomes: [
      "Real talking points beyond “I called the OpenAI API”",
      "An AI project with measurable latency and quality notes",
    ],
    chooseIf:
      "You're comfortable in Python and want the engineering behind AI features, not just prompts.",
    phaseFocus: {
      setup: "Run SupportPulse AI locally, learn the repo layout and open your first PR.",
      bugs: "Reproduce retrieval and API failures from logs and add tests around them.",
      core: "Build document ingestion, chunking and the retrieval API behind an auth layer.",
      speed: "Tune vector-search latency, rate limits and asynchronous queues.",
      capstone: "Containerise the pipeline, add CI/CD and ship a production-ready assistant.",
    },
  },
  frontend_ops: {
    id: "frontend_ops",
    name: "Frontend Ops Dashboard Lab",
    shortName: "Frontend Ops",
    project: "Ops Dashboard",
    tagline: "Build and optimise a Next.js dashboard",
    summary:
      "Build a data-heavy Next.js 15 dashboard and learn how real frontends are debugged, tested and tuned: re-renders, caching and bundle size.",
    level: 2,
    stack: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "Playwright"],
    requires: { git: 1, web_basics: 1.5, react: 1 },
    goalFit: { credit: 0.6, first_job: 0.8, portfolio: 0.85, upskill: 0.6 },
    ships: [
      "Auth-aware dashboard routes, data tables and forms",
      "A tested UI with Playwright and component tests",
      "Measured performance wins: fewer re-renders, smarter caching",
    ],
    outcomes: [
      "A polished, deployable frontend repository",
      "Interview-ready answers on state, rendering and performance",
    ],
    chooseIf:
      "You like building interfaces people use and want a portfolio that is visible in the browser.",
    phaseFocus: {
      setup: "Run the Next.js 15 dashboard locally and open your first PR.",
      bugs: "Fix real UI and state bugs and cover them with Playwright and component tests.",
      core: "Build dashboard features: auth-aware routes, data tables and validated forms.",
      speed: "Profile re-renders, caching and bundle size, then improve Core Web Vitals.",
      capstone: "Containerise the app, add CI/CD and ship the capstone release.",
    },
  },
  qa_automation: {
    id: "qa_automation",
    name: "QA & Test Automation Lab",
    shortName: "QA & Automation",
    project: "ApexCart E2E",
    tagline: "Break things on purpose, then automate it",
    summary:
      "Reproduce production-style bugs and build an automated end-to-end test suite for an e-commerce app, wired into CI.",
    level: 2,
    stack: ["Python", "Pytest", "Playwright", "GitHub Actions"],
    requires: { git: 1, python: 1, testing_basics: 0.5, web_basics: 0.5 },
    goalFit: { credit: 0.6, first_job: 0.75, portfolio: 0.5, upskill: 0.6 },
    ships: [
      "Reproduction tests for real bug reports",
      "A layered end-to-end suite with fixtures and page objects",
      "A CI pipeline that runs and reports the whole suite",
    ],
    outcomes: [
      "A test-automation repository recruiters can open and run",
      "Hands-on experience with flaky tests, coverage and CI",
    ],
    chooseIf:
      "You're detail-oriented and want an in-demand entry route into QA and SDET roles.",
    phaseFocus: {
      setup: "Run ApexCart locally, learn the test layout and open your first PR.",
      bugs: "Reproduce production bugs and write Pytest/Playwright suites that catch them.",
      core: "Build a layered E2E suite: page objects, fixtures and API-level checks.",
      speed: "Stabilise flaky tests, parallelise runs and track coverage.",
      capstone: "Wire the suite into GitHub Actions CI and ship the capstone report.",
    },
  },
  uiux_design: {
    id: "uiux_design",
    name: "UI/UX & Design Systems Lab",
    shortName: "UI/UX Design",
    project: "ApexDesign",
    tagline: "Design a system developers can build from",
    summary:
      "Design core product flows and a component library in Figma, then hand off specs and tokens that developers can implement.",
    level: 1,
    stack: ["Figma", "Design tokens", "Prototyping", "GitHub"],
    requires: { design_basics: 1, web_basics: 0.3, git: 0.3 },
    goalFit: { credit: 0.6, first_job: 0.6, portfolio: 0.85, upskill: 0.6 },
    ships: [
      "A usability and accessibility audit with documented fixes",
      "A component library and design tokens in Figma",
      "An interactive prototype with a developer hand-off",
    ],
    outcomes: [
      "A design-system case study for your portfolio",
      "A GitHub-visible record of your design work",
    ],
    chooseIf:
      "You think visually, care how things feel to use and want to work closely with engineers.",
    phaseFocus: {
      setup: "Set up your design workspace and the ApexDesign repo, then ship your profile PR.",
      bugs: "Audit existing screens for usability and accessibility issues and document the fixes.",
      core: "Design the core flows and a component library in Figma with design tokens.",
      speed: "Prototype, test with feedback and iterate; hand off specs developers can build from.",
      capstone: "Publish the design system and ship the capstone case study.",
    },
  },
};

/** Stable ordering, used as the final tie-breaker so results are deterministic. */
export const LAB_LIST: readonly Lab[] = LAB_IDS.map((id) => LABS[id]);
