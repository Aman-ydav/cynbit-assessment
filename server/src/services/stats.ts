import { EventModel } from "../models/Event";
import { LeadModel } from "../models/Lead";
import { PlanModel } from "../models/Plan";

/** Funnel stages, in order. Each is reported as the share of quiz starters who reached it. */
export const FUNNEL_STAGES = [
  { name: "path_started", label: "Started the quiz" },
  { name: "plan_generated", label: "Got a plan" },
  { name: "plan_viewed", label: "Viewed their plan" },
  { name: "enrol_clicked", label: "Clicked “Enrol”" },
  { name: "lead_submitted", label: "Asked to be contacted" },
] as const;

export interface FunnelRow {
  name: string;
  label: string;
  sessions: number;
  /** Share of quiz starters who reached this stage, 0–100. */
  pctOfStarted: number;
}

export interface Stats {
  totals: { plans: number; leads: number; sessions: number };
  funnel: FunnelRow[];
  steps: { step: number; sessions: number }[];
  labs: { lab: string; plans: number; avgMatch: number }[];
  unmatched: { interest: string; plans: number }[];
  daily: { date: string; plans: number }[];
  generatedAt: string;
}

const TZ = "Asia/Kolkata";
const DAYS = 14;

/** YYYY-MM-DD in Indian time, for bucketing plans per day. */
const dayKey = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date);

export async function getStats(now = new Date()): Promise<Stats> {
  const since = new Date(now.getTime() - DAYS * 24 * 60 * 60 * 1000);

  const [sessionsAgg, stepsAgg, labsAgg, unmatchedAgg, dailyAgg, plans, leads] = await Promise.all([
    // One document per session listing which events it produced → cohort funnel.
    EventModel.aggregate<{ _id: string; names: string[] }>([
      { $group: { _id: "$sessionId", names: { $addToSet: "$name" } } },
    ]),
    EventModel.aggregate<{ _id: number; sessions: number }>([
      { $match: { name: "step_completed", "props.step": { $type: "number" } } },
      { $group: { _id: { step: "$props.step", sid: "$sessionId" } } },
      { $group: { _id: "$_id.step", sessions: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    PlanModel.aggregate<{ _id: string; plans: number; avgMatch: number }>([
      { $group: { _id: "$primaryLab", plans: { $sum: 1 }, avgMatch: { $avg: "$matchPct" } } },
      { $sort: { plans: -1 } },
    ]),
    PlanModel.aggregate<{ _id: string; plans: number }>([
      { $unwind: "$unmatched" },
      { $group: { _id: "$unmatched", plans: { $sum: 1 } } },
      { $sort: { plans: -1, _id: 1 } },
      { $limit: 10 },
    ]),
    PlanModel.aggregate<{ _id: string; plans: number }>([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } },
          plans: { $sum: 1 },
        },
      },
    ]),
    PlanModel.countDocuments(),
    LeadModel.countDocuments(),
  ]);

  // Cohort funnel: a session counts at a stage only if it also started the quiz, so every
  // percentage is <= 100% (people who open a shared or sample plan directly are excluded).
  const starters = sessionsAgg.filter((s) => s.names.includes("path_started"));
  const funnel: FunnelRow[] = FUNNEL_STAGES.map((stage) => {
    const sessions =
      stage.name === "path_started"
        ? starters.length
        : starters.filter((s) => s.names.includes(stage.name)).length;
    return {
      ...stage,
      sessions,
      pctOfStarted: starters.length === 0 ? 0 : Math.round((sessions / starters.length) * 100),
    };
  });

  // Zero-fill so quiet days still appear on the chart.
  const perDay = new Map(dailyAgg.map((d) => [d._id, d.plans]));
  const daily = Array.from({ length: DAYS }, (_, index) => {
    const date = dayKey(new Date(now.getTime() - (DAYS - 1 - index) * 24 * 60 * 60 * 1000));
    return { date, plans: perDay.get(date) ?? 0 };
  });

  return {
    totals: { plans, leads, sessions: sessionsAgg.length },
    funnel,
    steps: stepsAgg.map((row) => ({ step: row._id, sessions: row.sessions })),
    labs: labsAgg.map((row) => ({ lab: row._id, plans: row.plans, avgMatch: Math.round(row.avgMatch) })),
    unmatched: unmatchedAgg.map((row) => ({ interest: row._id, plans: row.plans })),
    daily,
    generatedAt: now.toISOString(),
  };
}

/** Escape a CSV cell, neutralising spreadsheet formula injection (=, +, -, @, tab, CR). */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const csvRow = (cells: unknown[]) => cells.map(csvCell).join(",");
