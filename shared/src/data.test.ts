import { describe, expect, it } from "vitest";
import { COVERAGE_FLOOR, INTEREST_LIST } from "./interests";
import { LAB_IDS, LAB_LIST } from "./labs";
import { GOALS } from "./options";
import { PHASE_IDS, PHASES } from "./phases";
import { EXPECTED_SPRINT_HOURS, PROGRAM } from "./program";
import { SKILLS } from "./skills";

/**
 * Data-integrity tests. The curriculum knowledge lives in config, so these guard against a
 * typo in a lab or interest definition silently breaking recommendations.
 */
describe("program & phases", () => {
  it("phases cover days 1..60 contiguously with no gaps or overlaps", () => {
    let expectedStart = 1;
    for (const phase of PHASES) {
      expect(phase.days[0]).toBe(expectedStart);
      expect(phase.days[1]).toBeGreaterThanOrEqual(phase.days[0]);
      expectedStart = phase.days[1] + 1;
    }
    expect(expectedStart - 1).toBe(PROGRAM.durationDays);
  });

  it("has one phase per phase id, numbered in order", () => {
    expect(PHASES.map((p) => p.id)).toEqual([...PHASE_IDS]);
    expect(PHASES.map((p) => p.n)).toEqual([1, 2, 3, 4, 5]);
  });

  it("derives expected sprint hours from the daily range", () => {
    expect(EXPECTED_SPRINT_HOURS).toEqual([90, 120]);
  });

  it("lists a struck-through price above the actual price", () => {
    expect(PROGRAM.listPriceInr).toBeGreaterThan(PROGRAM.priceInr);
  });
});

describe("labs", () => {
  it("defines six labs", () => {
    expect(LAB_IDS).toHaveLength(6);
    expect(LAB_LIST).toHaveLength(6);
  });

  it.each(LAB_LIST.map((lab) => [lab.id, lab] as const))("%s is fully specified", (_id, lab) => {
    expect(lab.stack.length).toBeGreaterThan(0);
    expect(lab.ships.length).toBeGreaterThanOrEqual(3);
    expect(lab.outcomes.length).toBeGreaterThan(0);
    expect(lab.chooseIf.length).toBeGreaterThan(10);

    for (const phase of PHASE_IDS) expect(lab.phaseFocus[phase]?.length).toBeGreaterThan(10);

    for (const goal of GOALS) {
      expect(lab.goalFit[goal]).toBeGreaterThanOrEqual(0);
      expect(lab.goalFit[goal]).toBeLessThanOrEqual(1);
    }

    const requirements = Object.entries(lab.requires);
    expect(requirements.length).toBeGreaterThan(0);
    for (const [skill, weight] of requirements) {
      expect(skill in SKILLS).toBe(true);
      expect(weight).toBeGreaterThan(0);
    }
    // At least one core (weight >= 0.5) skill, otherwise readiness is meaningless.
    expect(requirements.some(([, weight]) => weight >= 0.5)).toBe(true);
  });
});

describe("interests", () => {
  it("only reference real labs with coverage in (0, 1]", () => {
    for (const interest of INTEREST_LIST) {
      for (const [labId, value] of Object.entries(interest.coverage)) {
        expect(LAB_IDS).toContain(labId);
        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it("gives every lab at least one interest it genuinely covers (no orphan labs)", () => {
    for (const lab of LAB_LIST) {
      const covered = INTEREST_LIST.some((i) => (i.coverage[lab.id] ?? 0) >= COVERAGE_FLOOR);
      expect(covered, `${lab.id} has no interest pointing to it`).toBe(true);
    }
  });

  it("includes the domains that have no lab yet, so demand can be measured", () => {
    const unmatched = INTEREST_LIST.filter(
      (i) => Math.max(0, ...Object.values(i.coverage)) < COVERAGE_FLOOR,
    ).map((i) => i.id);
    expect(unmatched).toEqual(
      expect.arrayContaining(["blockchain", "iot", "digital_marketing", "cybersecurity"]),
    );
  });
});
