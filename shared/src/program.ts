/**
 * BitElevate program facts.
 *
 * Source: the public BitElevate page (cynbit.in/bitelevate) as listed on 15 Nov 2026.
 * These are the only program-level numbers the engine relies on, so they live in one place
 * and can be corrected by Cynbit without touching any logic.
 */
export const PROGRAM = {
  name: "BitElevate",
  durationDays: 60,
  /** Daily effort the program expects ("Flexible 1.5–2h Daily"). */
  expectedHoursPerDay: { min: 1.5, max: 2 },
  /** "14-day semester exam freeze protection". */
  examFreezeDays: 14,
  priceInr: 1499,
  /** The struck-through price shown on the page. */
  listPriceInr: 3999,
  /** What every learner receives, regardless of lab. */
  outcomes: [
    "A real repository on your own GitHub, built through 60 daily deliverables",
    "Mentor feedback on every pull request you open",
    "A tamper-proof completion certificate with a public QR code",
    "A training acceptance letter and NOC for college credit",
  ],
} as const;

/** Total effort a learner should expect to invest across the 60 days. */
export const EXPECTED_SPRINT_HOURS: readonly [number, number] = [
  Math.round(PROGRAM.durationDays * PROGRAM.expectedHoursPerDay.min),
  Math.round(PROGRAM.durationDays * PROGRAM.expectedHoursPerDay.max),
];
