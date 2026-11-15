import { describe, expect, it } from "vitest";
import { decodeAnswers, encodeAnswers, planFromCode } from "./codec";
import { generatePlan } from "./engine";
import { answers, randomAnswers, seededRandom } from "./testing";

const toBase64Url = (text: string) =>
  btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const encodeTuple = (tuple: unknown) => toBase64Url(JSON.stringify(tuple));

describe("plan codes", () => {
  it("round-trips 500 random answer sets", () => {
    const rand = seededRandom(42);
    for (let i = 0; i < 500; i++) {
      const original = randomAnswers(rand);
      expect(decodeAnswers(encodeAnswers(original))).toEqual(original);
    }
  });

  it("is compact and URL-safe", () => {
    const code = encodeAnswers(
      answers({
        interests: ["ai", "nlp", "devops"],
        skills: ["git", "web_basics", "react", "python", "sql", "testing_basics", "design_basics"],
      }),
    );
    expect(code.length).toBeLessThan(80);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("regenerates the same plan from a code", () => {
    const original = answers({ interests: ["backend_apis"], skills: ["git", "python"] });
    expect(planFromCode(encodeAnswers(original))).toEqual(generatePlan(original));
  });

  it.each([
    ["empty", ""],
    ["not base64", "!!!!"],
    ["base64 but not JSON", toBase64Url("hello world")],
    ["too long", "A".repeat(500)],
    ["wrong version", encodeTuple([9, 0, 0, 0, [], 0, 0, []])],
    ["wrong shape", encodeTuple([1, 0, 0])],
    ["index out of range", encodeTuple([1, 99, 0, 0, [], 0, 0, []])],
    ["negative index", encodeTuple([1, -1, 0, 0, [], 0, 0, []])],
    ["fractional index", encodeTuple([1, 0.5, 0, 0, [], 0, 0, []])],
    ["string index", encodeTuple([1, "0", 0, 0, [], 0, 0, []])],
    ["bad exams flag", encodeTuple([1, 0, 0, 0, [], 0, 2, []])],
    ["duplicate interests", encodeTuple([1, 0, 0, 0, [1, 1], 0, 0, []])],
    ["too many interests", encodeTuple([1, 0, 0, 0, [0, 1, 2, 3], 0, 0, []])],
    ["duplicate skills", encodeTuple([1, 0, 0, 0, [], 0, 0, [2, 2]])],
    ["object instead of tuple", encodeTuple({ stage: "year1" })],
  ])("rejects %s", (_label, code) => {
    expect(decodeAnswers(code)).toBeNull();
    expect(planFromCode(code)).toBeNull();
  });

  it("rejects codes that were tampered with", () => {
    const code = encodeAnswers(answers({ interests: ["ai"] }));
    expect(decodeAnswers(code.slice(0, -3))).toBeNull();
    expect(decodeAnswers(`${code}%20`)).toBeNull();
  });
});
