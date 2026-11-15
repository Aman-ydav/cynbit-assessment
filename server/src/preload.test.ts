import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { encodeAnswers, type Answers } from "@bitelevate/shared";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeConfig, relaxedLimits, useTestDb } from "../test/helpers";
import { createApp } from "./app";
import { createPreloader } from "./preload";

useTestDb();

const SHELL =
  '<!doctype html><html><head><title>x</title>' +
  '<script type="module" crossorigin src="/assets/index-AAA.js"></script>' +
  '<link rel="modulepreload" crossorigin href="/assets/react-dom-BBB.js"></head><body><div id="root"></div></body></html>';

const MANIFEST = {
  "index.html": { file: "assets/index-AAA.js", isEntry: true, imports: ["_react-dom-BBB.js"] },
  "_react-dom-BBB.js": { file: "assets/react-dom-BBB.js" },
  "_api-CCC.js": { file: "assets/api-CCC.js" },
  "_zod-DDD.js": { file: "assets/zod-DDD.js" },
  // Plan statically imports the shell's react-dom chunk, its own api chunk, and (transitively) zod.
  "src/pages/Plan.tsx": {
    file: "assets/Plan-EEE.js",
    isDynamicEntry: true,
    imports: ["_react-dom-BBB.js", "_api-CCC.js"],
  },
  "src/pages/Wizard.tsx": { file: "assets/Wizard-FFF.js", isDynamicEntry: true, imports: ["_api-CCC.js", "_zod-DDD.js"] },
};

let dist: string;
beforeAll(() => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "preload-dist-"));
  fs.mkdirSync(path.join(dist, "assets"));
  fs.mkdirSync(path.join(dist, ".vite"));
  fs.writeFileSync(path.join(dist, "index.html"), SHELL);
  fs.writeFileSync(path.join(dist, ".vite", "manifest.json"), JSON.stringify(MANIFEST));
  for (const name of [
    "manrope-latin-wght-normal-HASH1.woff2",
    "plus-jakarta-sans-latin-wght-normal-HASH2.woff2",
    "manrope-cyrillic-wght-normal-HASH3.woff2", // other subsets must NOT be preloaded
  ]) {
    fs.writeFileSync(path.join(dist, "assets", name), "font");
  }
});
afterAll(() => fs.rmSync(dist, { recursive: true, force: true }));

describe("createPreloader", () => {
  it("preloads only the Latin fonts, with the crossorigin attribute fonts require", () => {
    const head = createPreloader(dist, SHELL).headFor("/");
    expect(head).toContain('href="/assets/manrope-latin-wght-normal-HASH1.woff2" as="font" type="font/woff2" crossorigin');
    expect(head).toContain("plus-jakarta-sans-latin-wght-normal-HASH2.woff2");
    expect(head).not.toContain("cyrillic");
    expect(head).not.toContain("modulepreload"); // the landing page has no extra route chunk
  });

  it("preloads a route's chunk and its dependencies, but not what the shell already loads", () => {
    const head = createPreloader(dist, SHELL).headFor("/plan/abc123");
    expect(head).toContain('<link rel="modulepreload" crossorigin href="/assets/Plan-EEE.js" />');
    expect(head).toContain('href="/assets/api-CCC.js"');
    expect(head).not.toContain("react-dom-BBB.js"); // already preloaded by the shell
  });

  it("follows static imports transitively for other routes", () => {
    const head = createPreloader(dist, SHELL).headFor("/path");
    expect(head).toContain("/assets/Wizard-FFF.js");
    expect(head).toContain("/assets/zod-DDD.js");
  });

  it("adds nothing route-specific for unknown paths, and degrades without a manifest", () => {
    expect(createPreloader(dist, SHELL).headFor("/nope")).not.toContain("modulepreload");
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "no-manifest-"));
    try {
      expect(createPreloader(empty, SHELL).headFor("/plan/abc")).toBe("");
    } finally {
      fs.rmSync(empty, { recursive: true, force: true });
    }
  });

  it("escapes quotes in file names", () => {
    const hostile = { ...MANIFEST, "src/pages/Plan.tsx": { file: 'assets/x".js', imports: [] } };
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hostile-"));
    try {
      fs.mkdirSync(path.join(tmp, ".vite"));
      fs.writeFileSync(path.join(tmp, ".vite", "manifest.json"), JSON.stringify(hostile));
      expect(createPreloader(tmp, SHELL).headFor("/plan/abc")).toContain("x&quot;.js");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe("preload hints in the served page", () => {
  const answers: Answers = {
    stage: "year3", experience: "basics", goal: "first_job", interests: [],
    hoursPerDay: "h1_5_2", examsSoon: false, skills: [],
  };
  // Built inside the test: `dist` only exists once beforeAll has run.
  const makeApp = () => createApp(makeConfig({ CLIENT_DIST: dist }), { limits: relaxedLimits });

  it("puts font and route-chunk hints in <head> for a shared plan link", async () => {
    const res = await request(makeApp()).get(`/plan/${encodeAnswers(answers)}`);
    expect(res.status).toBe(200);
    const head = res.text.slice(0, res.text.indexOf("</head>"));
    expect(head).toContain('rel="preload"');
    expect(head).toContain("/assets/Plan-EEE.js");
  });
});
