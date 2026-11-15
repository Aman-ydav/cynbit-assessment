import { describe, expect, it } from "vitest";
import { computeReadiness, generatePlan, matchLabel } from "./engine";
import { LABS, LAB_IDS, type LabId } from "./labs";
import { PROGRAM } from "./program";
import { answers, randomAnswers, seededRandom } from "./testing";

describe("golden learner profiles", () => {
  it("beginner who likes frontend → Frontend Ops, with a prep sprint", () => {
    const plan = generatePlan(
      answers({
        stage: "year2",
        experience: "none",
        interests: ["frontend_web"],
        skills: ["web_basics"],
      }),
    );
    expect(plan.primary.labId).toBe("frontend_ops");
    expect(plan.readiness.band).toBe("prep_first");
    expect(plan.schedule.prepDays).toBeGreaterThan(0);
    expect(plan.timeline[0]?.id).toBe("prep");
  });

  it("python developer interested in backend + devops → Python Backend, ready to start", () => {
    const plan = generatePlan(
      answers({ interests: ["backend_apis", "devops"], skills: ["git", "python", "sql"] }),
    );
    expect(plan.primary.labId).toBe("python_backend");
    expect(plan.readiness.band).toBe("ready");
    expect(plan.schedule.prepDays).toBe(0);
    expect(plan.timeline[0]?.id).toBe("setup");
  });

  it("experienced learner interested in NLP and AI → AI & Vector", () => {
    const plan = generatePlan(
      answers({
        stage: "final_year",
        experience: "projects",
        goal: "portfolio",
        interests: ["nlp", "ai"],
        skills: ["git", "python", "sql"],
      }),
    );
    expect(plan.primary.labId).toBe("ai_vector");
    expect(plan.primary.matchPct).toBeGreaterThanOrEqual(80);
  });

  it("designer → UI/UX, ready without needing coding prep", () => {
    const plan = generatePlan(
      answers({
        stage: "year1",
        experience: "none",
        goal: "portfolio",
        interests: ["ui_ux"],
        skills: ["design_basics"],
      }),
    );
    expect(plan.primary.labId).toBe("uiux_design");
    expect(plan.readiness.band).toBe("ready");
    expect(plan.schedule.prepDays).toBe(0);
    // Optional skills are surfaced separately rather than blocking the start.
    expect(plan.readiness.optionalGaps.length).toBeGreaterThan(0);
  });

  it("QA-minded learner → QA & Automation", () => {
    const plan = generatePlan(
      answers({ interests: ["qa_testing"], skills: ["git", "python", "testing_basics"] }),
    );
    expect(plan.primary.labId).toBe("qa_automation");
  });

  it("full-stack ready learner → Full Stack with a very strong match", () => {
    const plan = generatePlan(
      answers({
        stage: "final_year",
        interests: ["full_stack_web"],
        skills: ["git", "web_basics", "python", "sql", "react"],
      }),
    );
    expect(plan.primary.labId).toBe("fullstack");
    expect(plan.primary.matchPct).toBeGreaterThanOrEqual(90);
    expect(plan.notes.join(" ")).toMatch(/final-year/i);
  });

  it("every lab can be the recommendation for some learner", () => {
    const winners = new Set<LabId>();
    const probes = [
      answers({ interests: ["full_stack_web"], skills: ["git", "web_basics", "python", "sql"] }),
      answers({ interests: ["backend_apis"], skills: ["git", "python", "sql"] }),
      answers({ experience: "projects", interests: ["nlp"], skills: ["git", "python"] }),
      answers({ experience: "none", interests: ["frontend_web"] }),
      answers({ interests: ["qa_testing"] }),
      answers({ experience: "none", interests: ["ui_ux"] }),
    ];
    for (const probe of probes) winners.add(generatePlan(probe).primary.labId);
    expect([...winners].sort()).toEqual([...LAB_IDS].sort());
  });
});

describe("interests no lab covers", () => {
  it("reports them as unmatched and falls back to goal and level", () => {
    const plan = generatePlan(answers({ goal: "upskill", interests: ["blockchain"] }));
    expect(plan.unmatched.map((u) => u.id)).toEqual(["blockchain"]);
    expect(plan.unmatched[0]?.message).toMatch(/no bitelevate lab covers/i);
    expect(plan.notes.join(" ")).toMatch(/none of your chosen topics/i);
  });

  it("names the closest lab when one partly touches the interest", () => {
    const plan = generatePlan(answers({ interests: ["cybersecurity", "backend_apis"] }));
    const cyber = plan.unmatched.find((u) => u.id === "cybersecurity");
    expect(cyber?.closestLab).toBe("python_backend");
    expect(cyber?.message).toMatch(/closest is the Python Backend Lab/);
  });

  it("does not let an unmatched interest weaken the match for the others", () => {
    const base = answers({ interests: ["ai"], skills: ["git", "python"] });
    const withExtra = answers({ interests: ["ai", "blockchain"], skills: ["git", "python"] });
    expect(generatePlan(withExtra).primary.matchPct).toBe(generatePlan(base).primary.matchPct);
  });

  it("explains that matching leaned on goal and experience when the learner is unsure", () => {
    const plan = generatePlan(answers({ interests: [] }));
    expect(plan.notes.join(" ")).toMatch(/weren't sure/i);
    expect(plan.unmatched).toEqual([]);
  });
});

describe("honesty about stretch and pace", () => {
  it("offers a gentler lab when a beginner's best interest match is a big stretch", () => {
    const plan = generatePlan(answers({ experience: "none", interests: ["ai"] }));
    expect(plan.primary.labId).toBe("ai_vector");
    expect(plan.primary.reasons.join(" ")).toMatch(/stretch/i);
    expect(plan.notes.join(" ")).toMatch(/gentler start/i);
  });

  it("warns when under an hour a day is available", () => {
    const plan = generatePlan(answers({ hoursPerDay: "lt1" }));
    expect(plan.schedule.pace.status).toBe("tight");
    expect(plan.schedule.pace.message).toMatch(/below the 1\.5–2 hours/);
  });

  it("adds the exam freeze to the calendar when exams are coming", () => {
    const plan = generatePlan(answers({ examsSoon: true }));
    expect(plan.schedule.freezeDays).toBe(PROGRAM.examFreezeDays);
    expect(plan.notes.join(" ")).toMatch(/freeze of up to 14 days/);
  });

  it("caps very long prep estimates and says so", () => {
    const plan = generatePlan(
      answers({ experience: "none", hoursPerDay: "lt1", interests: ["ai"], skills: [] }),
    );
    expect(plan.schedule.prepDays).toBeLessThanOrEqual(28);
    expect(plan.schedule.prepCapped).toBe(true);
  });

  it("labels weak matches as the closest fit instead of overstating them", () => {
    expect(matchLabel(95)).toBe("Strong match");
    expect(matchLabel(80)).toBe("Strong match");
    expect(matchLabel(65)).toBe("Good match");
    expect(matchLabel(52)).toBe("Closest fit");
  });
});

describe("readiness", () => {
  it("is 100 with every core skill and 0 with none", () => {
    const lab = LABS.fullstack;
    expect(computeReadiness(lab, ["git", "web_basics", "python", "sql", "react"]).score).toBe(100);
    expect(computeReadiness(lab, []).score).toBe(0);
  });

  it("orders gaps by importance, then quickest to close", () => {
    const gaps = computeReadiness(LABS.fullstack, []).gaps.map((g) => g.skill);
    // git/web_basics/python have weight 1; git (6 h) is quicker than python/web (20 h).
    expect(gaps[0]).toBe("git");
    expect(gaps.slice(-2)).toEqual(["sql", "react"]);
  });
});

describe("invariants over 800 random learners", () => {
  const rand = seededRandom(20261115);
  const plans = Array.from({ length: 800 }, () => generatePlan(randomAnswers(rand)));

  it("is deterministic and does not mutate its input", () => {
    const input = randomAnswers(seededRandom(7));
    const snapshot = JSON.stringify(input);
    expect(generatePlan(input)).toEqual(generatePlan(input));
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("always returns a well-formed recommendation", () => {
    for (const plan of plans) {
      expect(LAB_IDS).toContain(plan.primary.labId);
      expect(Number.isInteger(plan.primary.matchPct)).toBe(true);
      expect(plan.primary.matchPct).toBeGreaterThanOrEqual(0);
      expect(plan.primary.matchPct).toBeLessThanOrEqual(100);
      expect(plan.primary.reasons.length).toBeGreaterThanOrEqual(1);
      expect(plan.primary.reasons.length).toBeLessThanOrEqual(4);
      expect(plan.primary.reasons.every((r) => r.length > 0)).toBe(true);
      expect(plan.enrol.labId).toBe(plan.primary.labId);
    }
  });

  it("returns at most two distinct alternates, never the primary", () => {
    for (const plan of plans) {
      expect(plan.alternates.length).toBeLessThanOrEqual(2);
      const ids = plan.alternates.map((a) => a.labId);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).not.toContain(plan.primary.labId);
      for (const alt of plan.alternates) {
        expect(alt.matchPct).toBeLessThanOrEqual(plan.primary.matchPct);
      }
    }
  });

  it("keeps readiness and the schedule internally consistent", () => {
    for (const plan of plans) {
      expect(plan.readiness.score).toBeGreaterThanOrEqual(0);
      expect(plan.readiness.score).toBeLessThanOrEqual(100);
      const { schedule } = plan;
      expect(schedule.prepDays).toBeGreaterThanOrEqual(0);
      expect(schedule.prepDays).toBeLessThanOrEqual(28);
      expect(schedule.totalCalendarDays).toBe(
        schedule.prepDays + schedule.sprintDays + schedule.freezeDays,
      );
      expect(schedule.totalCalendarWeeks).toBe(Math.ceil(schedule.totalCalendarDays / 7));
      expect(schedule.freezeDays).toBe(plan.answers.examsSoon ? PROGRAM.examFreezeDays : 0);
      // Prep only exists when a core skill is missing.
      expect(schedule.prepDays > 0).toBe(plan.readiness.gaps.length > 0);
    }
  });

  it("builds a timeline that covers all 60 days exactly once", () => {
    for (const plan of plans) {
      const phases = plan.timeline.filter((step) => step.kind === "phase");
      expect(phases).toHaveLength(5);
      expect(plan.timeline.length).toBe(5 + (plan.schedule.prepDays > 0 ? 1 : 0));

      let day = 1;
      for (const step of phases) {
        expect(step.dayRange?.[0]).toBe(day);
        day = (step.dayRange?.[1] ?? 0) + 1;
        expect(step.labFocus).toBe(LABS[plan.primary.labId].phaseFocus[step.id as never]);
      }
      expect(day - 1).toBe(PROGRAM.durationDays);
    }
  });

  it("reports an interest as unmatched only if no lab covers it", () => {
    for (const plan of plans) {
      for (const unmatched of plan.unmatched) {
        expect(plan.answers.interests).toContain(unmatched.id);
      }
    }
  });
});
