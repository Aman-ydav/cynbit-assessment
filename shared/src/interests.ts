import type { LabId } from "./labs";

/**
 * Interest domains a learner can pick, and how strongly each of the six labs covers them.
 *
 * Why this exists: today the public "Learning Paths" page lists 16 domains while only six labs
 * can be purchased, and three of the six labs (Frontend, Backend, QA) have no matching tile.
 * This table is the single source of truth that reconciles the two. Coverage values are the
 * prototype author's assumptions (0 = not covered, 1 = the lab's core focus) for mentors to review.
 */
export const INTEREST_IDS = [
  "full_stack_web",
  "frontend_web",
  "backend_apis",
  "ui_ux",
  "qa_testing",
  "ai",
  "ml",
  "deep_learning",
  "nlp",
  "data_science",
  "data_analytics",
  "devops",
  "cloud",
  "cybersecurity",
  "blockchain",
  "iot",
  "digital_marketing",
  "social_media",
  "business_analytics",
] as const;

export type InterestId = (typeof INTEREST_IDS)[number];

export type InterestGroup = "web" | "design" | "ai_data" | "infra" | "other";

export interface Interest {
  id: InterestId;
  label: string;
  group: InterestGroup;
  blurb: string;
  coverage: Partial<Record<LabId, number>>;
  /** Extra context shown when no lab covers this interest well. */
  note?: string;
}

/** Below this coverage a lab is not considered to genuinely cover an interest. */
export const COVERAGE_FLOOR = 0.35;

export const GROUP_LABEL: Record<InterestGroup, string> = {
  web: "Build for the web",
  design: "Design & quality",
  ai_data: "AI & data",
  infra: "Infrastructure & security",
  other: "Everything else",
};

export const GROUP_ORDER: readonly InterestGroup[] = ["web", "design", "ai_data", "infra", "other"];

export const INTERESTS: Record<InterestId, Interest> = {
  full_stack_web: {
    id: "full_stack_web",
    label: "Full-stack web",
    group: "web",
    blurb: "Frontend, backend and database together",
    coverage: { fullstack: 1, frontend_ops: 0.6, python_backend: 0.4 },
  },
  frontend_web: {
    id: "frontend_web",
    label: "Frontend & web UI",
    group: "web",
    blurb: "React, dashboards, performance",
    coverage: { frontend_ops: 1, fullstack: 0.6, uiux_design: 0.4 },
  },
  backend_apis: {
    id: "backend_apis",
    label: "Backend & APIs",
    group: "web",
    blurb: "Servers, databases, authentication",
    coverage: { python_backend: 1, fullstack: 0.6, ai_vector: 0.3 },
  },
  ui_ux: {
    id: "ui_ux",
    label: "UI/UX design",
    group: "design",
    blurb: "Flows, prototypes, design systems",
    coverage: { uiux_design: 1, frontend_ops: 0.4 },
  },
  qa_testing: {
    id: "qa_testing",
    label: "Testing & QA automation",
    group: "design",
    blurb: "Test suites, CI, reliability",
    coverage: { qa_automation: 1 },
  },
  ai: {
    id: "ai",
    label: "Artificial intelligence",
    group: "ai_data",
    blurb: "Building AI-powered products",
    coverage: { ai_vector: 1, python_backend: 0.4 },
  },
  ml: {
    id: "ml",
    label: "Machine learning",
    group: "ai_data",
    blurb: "Models, training, evaluation",
    coverage: { ai_vector: 0.7, python_backend: 0.4 },
  },
  deep_learning: {
    id: "deep_learning",
    label: "Deep learning",
    group: "ai_data",
    blurb: "Neural networks",
    coverage: { ai_vector: 0.55 },
  },
  nlp: {
    id: "nlp",
    label: "NLP & LLM apps",
    group: "ai_data",
    blurb: "Language models and retrieval",
    coverage: { ai_vector: 0.9 },
  },
  data_science: {
    id: "data_science",
    label: "Data science",
    group: "ai_data",
    blurb: "Analysis, modelling, insight",
    coverage: { ai_vector: 0.5, python_backend: 0.4 },
  },
  data_analytics: {
    id: "data_analytics",
    label: "Data analytics",
    group: "ai_data",
    blurb: "Querying and reporting",
    coverage: { python_backend: 0.4 },
  },
  devops: {
    id: "devops",
    label: "DevOps & CI/CD",
    group: "infra",
    blurb: "Docker, pipelines, releases",
    coverage: { fullstack: 0.5, python_backend: 0.5, qa_automation: 0.4 },
  },
  cloud: {
    id: "cloud",
    label: "Cloud computing",
    group: "infra",
    blurb: "Deploying and running software",
    coverage: { fullstack: 0.35, python_backend: 0.35 },
  },
  cybersecurity: {
    id: "cybersecurity",
    label: "Cybersecurity",
    group: "infra",
    blurb: "Securing software and systems",
    coverage: { python_backend: 0.3 },
    note: "Its final phase includes a security audit, which touches the basics.",
  },
  blockchain: {
    id: "blockchain",
    label: "Blockchain",
    group: "other",
    blurb: "Distributed ledgers",
    coverage: {},
  },
  iot: {
    id: "iot",
    label: "Internet of Things",
    group: "other",
    blurb: "Connected devices",
    coverage: {},
  },
  digital_marketing: {
    id: "digital_marketing",
    label: "Digital marketing",
    group: "other",
    blurb: "Growth, SEO, campaigns",
    coverage: {},
  },
  social_media: {
    id: "social_media",
    label: "Social media management",
    group: "other",
    blurb: "Community and content",
    coverage: {},
  },
  business_analytics: {
    id: "business_analytics",
    label: "Business analytics",
    group: "other",
    blurb: "Metrics for decisions",
    coverage: {},
  },
};

export const INTEREST_LIST: readonly Interest[] = INTEREST_IDS.map((id) => INTERESTS[id]);

export const MAX_INTERESTS = 3;
