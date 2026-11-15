# BitElevate Path Generator

**An instant, explainable, personalised 60-day plan for Cynbit's BitElevate internship — the working version of the "Generate My Custom Path" button.**

Built as an improvement proposal for Cynbit Technologies · MongoDB · Express · React · Node.js · shadcn/ui · TypeScript

| | |
|---|---|
| 🔗 **Live demo** | `<<add the deployed URL after deploying>>` |
| 📦 **Source** | this repository — a clean, incremental commit history |
| ✅ **Quality** | 231 automated tests · Lighthouse mobile 93–98 · axe WCAG 2.2 AA clean |
| ℹ️ **Status** | A prototype built for an assessment. Not an official Cynbit product. |

![Landing page and a generated plan](docs/screenshots/landing.jpg)

## In one minute

- **The problem.** On cynbit.in, the *Generate My Custom Path* button doesn't generate anything. It collects a lead and says a human will reply in about 24 hours. Learners get no guidance at the moment of highest intent, and Cynbit can't see where they drop off.
- **The fix.** Five short questions → an **instant plan** with the reasons for the recommended lab, a readiness check, and a 60-day timeline built from BitElevate's real five phases. Contact details are asked for *after* the learner has seen value, with consent.
- **The proof.** The funnel is instrumented end to end, an admin dashboard shows where learners drop off, and 231 automated tests plus Lighthouse and axe results back the quality claims below.

## Contents

1. [Problem statement](#1-problem-statement)
2. [Why this improvement](#2-why-this-improvement)
3. [The solution](#3-the-solution)
4. [Technology choices](#4-technology-choices)
5. [Implementation](#5-implementation)
6. [Results](#6-results)
7. [Reviewer's 2-minute tour](#7-reviewers-2-minute-tour)
8. [Run it, test it, deploy it](#8-run-it-test-it-deploy-it)
9. [Integrating into cynbit.in](#9-integrating-into-cynbitin)
10. [Assumptions, limitations and next steps](#10-assumptions-limitations-and-next-steps)

---

## 1. Problem statement

I reviewed every public page of cynbit.in on desktop and mobile, read the HTML and JavaScript it serves, and ran Lighthouse (all on **15 November 2026**). BitElevate — a paid, ₹1,499, 60-day remote internship — is both Cynbit's volume revenue line and its talent pipeline, so the path from "interested" to "enrolled" matters most. The evidence:

| # | Observation | Evidence | Why it matters |
|---|---|---|---|
| 1 | **"Generate My Custom Path" generates nothing.** | `/bitelevate/paths` promises *"AI-driven customization"*. The button opens a form that calls the generic lead action; the confirmation says *"A senior architect will reach out within 24 hours."* | No value at the moment of highest intent. Every lead consumes human time. |
| 2 | **Three different track lists.** | Homepage: 3 tracks. `/bitelevate`: 6 labs (the only ones you can buy). `/bitelevate/paths`: 16 domains. Three of the six labs (Frontend, Backend, QA) have no matching domain tile. | Choice overload right before payment; learners can tick things they can't buy and can't find things they can. |
| 3 | **Price and enrolment are buried.** | ₹1,499 first appears ~73% down `/bitelevate` on desktop, ~11 screens down on a phone; the `duration` field has a single option. | The main action is a long scroll away on the device students use most. |
| 4 | **The funnel can't be measured.** | Only the base GA4 `config` call appears in the client bundles; no form-start, submit, CTA or lab-selection events. | Nobody can say where learners drop off. *(GA4's enhanced measurement may capture some interactions; server-action submits are unlikely to register.)* |
| 5 | **Mobile performance is weak under realistic throttling.** | Lighthouse mobile (simulated slow 4G, 4× CPU): performance **35–68**, LCP **9–11 s**, up to **5.2 s** blocking time. A ~**1.1 MB** icon font is about two-thirds of the homepage weight. | Students are often on mid-range phones and mobile data. |

What I could **not** verify: Cynbit's real traffic, conversion rates, or the numbers it advertises (1,000+ graduates, 88% placement, 25k+ readers). I make no claims about them.

## 2. Why this improvement

I considered five areas. Everything is tied to evidence above.

| Option | Verdict |
|---|---|
| **Make "Generate My Custom Path" real** (this prototype) | ✅ **Chosen.** The slot already exists in the design, it's tied to revenue and talent, it can be demonstrated end to end, and it's measurable. Purely additive, so it can't break checkout. |
| Guided project brief for the B2B contact form | Strong second. Same pattern, different audience — listed under next steps. |
| Mobile performance and Core Web Vitals fixes | Real and well-evidenced, but it's a patch to code I can't see, so it can't be shown as a working prototype. I list the specific fixes instead (see [§10](#10-assumptions-limitations-and-next-steps)). |
| Job-application form redesign | Real friction (25+ fields), smaller audience. |
| "Ask Cynbit" AI chatbot | Weak evidence of need, real cost/abuse/hallucination risk. |

## 3. The solution

**A learner's journey** — about 90 seconds, no sign-up:

1. **Five short questions:** where you are, your goal, up to three interests, daily time (and exams), and which core skills you already have.
2. **An instant plan:**
   - the **best-fit lab with the reasons why**, a runner-up, and *"choose it instead if…"*;
   - a **readiness check** — the core skills to brush up, with hours and a concrete task for each;
   - a **60-day timeline** from BitElevate's five real phases, showing what each phase looks like in *that* lab, plus tips tailored to the learner;
   - **honesty about gaps** — if the learner is interested in something no lab covers (blockchain, IoT…), it says so, points to the closest lab, and records the demand.
3. **Then, optionally,** share the plan (WhatsApp, link, print), enrol on cynbit.in (UTM-tagged so Cynbit can attribute enrolments), or ask an advisor — with explicit consent, a honeypot, and one-click **Delete my details**.

| Landing | Your plan |
|---|---|
| ![Landing page](docs/screenshots/landing.jpg) | ![Plan page](docs/screenshots/plan.jpg) |

| Quiz on a phone | Plan on a phone | Admin funnel |
|---|---|---|
| <img src="docs/screenshots/wizard-mobile.jpg" width="220" alt="Quiz step on a phone"> | <img src="docs/screenshots/plan-mobile.jpg" width="220" alt="Plan on a phone, with the price and Enrol action in view"> | <img src="docs/screenshots/admin.jpg" width="420" alt="Admin dashboard"> |

**How it differs from the current flow**

| | Today on cynbit.in | This prototype |
|---|---|---|
| Time to a useful answer | "Within ~24 hours", by a person | Instant, about 90 seconds to complete |
| Choosing a lab | A bare dropdown of six | Explained recommendation, runner-up, and when to pick it instead |
| Interests no lab covers | Silently accepted, can't be bought | Said plainly; closest lab suggested; demand recorded for Cynbit |
| Contact details | Required up front | Optional, after value, with consent and deletion |
| Price on a phone | ~11 screens down | In view on the first screen of the plan |
| Funnel visibility | Page views only, as far as the client code shows | Typed events + admin funnel, quiz drop-off and demand signal |

## 4. Technology choices

Built on **MongoDB · Express · React · Node.js** with **shadcn/ui** and TypeScript, as a three-package monorepo (npm workspaces).

| Choice | Why | Trade-off |
|---|---|---|
| **TypeScript everywhere** | One language; the engine and request/response types are shared by browser and API, so they can't drift. | Needs a build step. |
| **`shared/` package** (engine, config, schemas) | The matching logic is framework-agnostic and unit-testable, and portable into cynbit.in's Next.js codebase. | One more package to maintain. |
| **React 19 + Vite** | Fast dev loop, small output, route-level code splitting. | Client-rendered; body copy isn't server-rendered HTML (previews are — see below). |
| **shadcn/ui on Tailwind v4** | Accessible Radix primitives that live *in the repo*, so they can be themed to Cynbit's palette (`#006067`) and changed freely. | Components are copied in, not versioned by a package. |
| **Express 5 + Mongoose** | A thin, well-understood API layer; async errors propagate automatically. | Per-instance rate limits (see limitations). |
| **MongoDB** | Event and plan documents are naturally schemaless; TTL indexes expire analytics automatically (events 180 days, anonymous plans 1 year). | Aggregations run in the app for the funnel. |
| **Zod** | One schema validates a request in the browser *and* on the server; parsing yields plain values, so Mongo operator injection can't reach a query. | Its JIT is disabled (strict CSP forbids `eval`). |
| **Deterministic engine, no LLM** | Instant, free, explainable, testable, and it can't invent facts about Cynbit's curriculum. | Less "magic"; knowledge lives in reviewable config files. |
| **Vitest · Supertest · Playwright · axe-core** | Fast unit/API tests against a real in-memory MongoDB, plus real-Chrome end-to-end and WCAG 2.2 AA scans. | The first run downloads a `mongod` binary (~600 MB, cached). |

## 5. Implementation

```
shared/   TypeScript, framework-agnostic — used by BOTH sides
          engine · labs/phases/interests config · zod schemas · plan codec
client/   React 19 + Vite + shadcn/ui          server/   Express 5 + Mongoose (MongoDB)
  landing · wizard · plan · admin                 POST /api/plans        validate → engine → record analytics
  typed events → /api/events (+ optional GA4)     GET  /api/plans/:code  stateless (no DB read)
                                                  POST /api/leads        consent, honeypot, hashed delete token
                                                  POST /api/events       anonymous funnel events
                                                  /api/admin/*           JWT cookie auth, stats, CSV export
                                                  HTML shell: per-route OG tags, preloads, real 404s
```

### The matching engine (`shared/src/engine.ts`)

Same answers → same plan, every time. No model call, no randomness.

| Factor | Weight | Notes |
|---|---|---|
| Interests | 50% | Averaged over the interests that *some* lab covers. Uncovered interests are reported separately and don't drag the rest down. |
| Goal | 20% | Credit, first job, portfolio, upskill. |
| Experience vs. lab level | 20% | A lab above the learner's level is penalised and flagged honestly ("a stretch… plan a prep sprint"); a gentler lab is suggested. |
| Skills | 10% | Readiness is computed from *core* skills only; "ready" means no core skill is missing. |

All curriculum knowledge lives in config — `labs.ts`, `interests.ts`, `phases.ts`, `skills.ts`, `program.ts` — so Cynbit's mentors can review and correct it without touching logic. Anything I inferred rather than read from the public site is marked `inferred` in the comments.

### Key design decisions

- **A plan is a pure function of the answers.** A share link just carries the answers, packed into ~40 URL-safe characters (`shared/src/codec.ts`). Links need no database, contain no personal data, never expire, and work even if storage is down. The decoder is strict: malformed or tampered codes return `null`.
- **Link previews that work.** Preview crawlers (WhatsApp, LinkedIn) don't run JavaScript, so the server injects Open Graph and Twitter tags per route, with a PNG share image (SVG social images are ignored by most platforms — an issue on cynbit.in's current `og:image`). Unknown routes and invalid plan links return real 404s.
- **Fast by delivery, not just by size.** The server reads Vite's build manifest and preloads each route's chunks and the Latin fonts in `<head>`; the advisor form's libraries load on demand; nothing is hidden at `opacity: 0` while it animates in.
- **Analytics writes are best-effort.** A database hiccup never breaks the learner's plan.

### API

| Method & path | Purpose |
|---|---|
| `POST /api/plans` | `{ answers, sessionId? }` → `{ code, plan }`; validates, generates, records anonymous analytics |
| `GET /api/plans/:code` | Rebuilds a plan from a share code (404 for invalid/tampered codes) |
| `POST /api/leads` | Consented contact request; honeypot + rate limit; returns a one-time `deleteToken` |
| `DELETE /api/leads/:token` | "Delete my details" |
| `POST /api/events` | Anonymous client funnel events (server-truth events can't be forged) |
| `GET /api/config` | Which optional features (email) the server can honour |
| `POST /api/admin/login` · `logout` · `GET /me` | Admin session (HttpOnly, SameSite=Lax cookie) |
| `GET /api/admin/stats` · `/leads` · `/leads.csv` | Dashboard data and spreadsheet-safe CSV |

### Data

| Collection | Holds | Retention |
|---|---|---|
| `events` | Anonymous funnel events keyed by a per-tab random session id | 180 days (TTL index) |
| `plans` | An anonymous copy of the quiz answers + recommended lab (the demand signal) | 1 year (TTL index) |
| `leads` | Name, email, optional phone, chosen lab, consent time, hashed delete token. One per email + plan | Until the learner deletes it |

### Privacy and security

- Building a plan needs **no personal data**. Contact details are collected **after** the plan is seen, with explicit consent; never date of birth, gender or address. Delete tokens are stored **hashed**.
- Respects **Do Not Track** (nothing is sent). No cookies except the admin session. A real [privacy notice](client/src/pages/Privacy.tsx) says exactly what's stored.
- Helmet with a **strict CSP** (no `eval`, no third-party scripts unless GA is enabled), per-IP rate limits, 10 KB body limit, `sanitizeFilter` + zod on every body (operator injection is tested), honeypot, constant-time admin password check, JWT pinned to HS256 (`alg:none` forgeries tested).
- CSV export neutralises spreadsheet formula injection; emails HTML-escape user input and only claim "sent" if the provider accepted the message.

### Analytics events

| Event | Sent by | When |
|---|---|---|
| `path_started` | browser | the wizard opens |
| `step_completed` `{step}` | browser | each step is completed |
| `plan_generated` `{lab,match,unmatched}` | **server** | a plan is created (truth for the funnel) |
| `plan_viewed` `{lab,match}` | browser | a plan is opened |
| `enrol_clicked` `{lab,match}` | browser | the learner follows the enrol link (UTM-tagged) |
| `lead_form_opened` · `plan_shared` · `plan_link_copied` · `plan_printed` | browser | engagement |
| `lead_submitted` `{lab,advisor,email}` | **server** | a consented lead is saved |

## 6. Results

### Performance and accessibility

Lighthouse 13.6.0 on the production build, **mobile profile** (simulated slow 4G, 4× CPU slowdown, Moto G Power) — the same profile I used to audit cynbit.in.

| Page | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| Landing `/` | **98** | 100 | 100 | 100 | 1.1 s | 180 ms | 0 |
| Wizard `/path` | **96** | 100 | 100 | 100 | 2.7 s | 62 ms | 0 |
| Plan `/plan/…` | **93** | 100 | 100 | 63¹ | 3.2 s | 45 ms | 0 |
| Privacy `/privacy` | **97** | 100 | 100 | 100 | 2.5 s | 43 ms | 0 |

¹ Intentional: shared plan links are `noindex`.

| | cynbit.in (15 Nov 2026) | This prototype |
|---|---|---|
| Mobile performance | 35–68 | 93–98 |
| LCP | 9–11 s | 1.1–3.2 s |
| Blocking time | up to 5.2 s | ≤ 180 ms |
| Page weight | ~1.7 MB (≈1.1 MB is one icon font) | ~230–330 KB |

**Honest caveats.** These are single-machine lab numbers; Lighthouse's trace was flaky on localhost, so I kept successful runs (1–2 per page) rather than a median of many. My app was measured on localhost and cynbit.in over the internet, which slightly favours mine. And the **plan page's LCP (3.2 s) is still above Google's 2.5 s "good" threshold** — the remaining cost is loading that route's chunk.

Accessibility is checked with **axe-core against WCAG 2.2 AA** on every page and state: landing, each wizard state, the plan, the advisor dialog and its error state, privacy, not-found, admin sign-in and the dashboard. Keyboard-only use, the skip link, focus management, `prefers-reduced-motion` and ≥ 44 px touch targets are tested too.

### Tests — 231, all passing

| Layer | Tests | What they cover |
|---|---|---|
| `shared` (Vitest) | 70 | data integrity (phases cover days 1–60, every lab reachable), golden learner profiles, invariants over 800 random learners, plan-code round-trips, malformed/tampered code rejection, and a 3,000-case fuzz test proving the hand-written decoder accepts only what the zod schema accepts |
| `server` (Vitest + Supertest, real in-memory MongoDB) | 125 | validation, NoSQL-injection attempts, consent and honeypot, hashed delete tokens, email honesty, rate limits, admin auth attacks (`alg:none`, expired, wrong-secret), cohort-funnel maths, CSV formula-injection safety, link-preview tags, preload hints, real 404s |
| End-to-end (Playwright, real Chrome) | 36 | the full learner journey, shared links, advisor request and deletion, admin, keyboard-only quiz, reduced motion, CSP violations, phone layout, and axe on every page |

Real defects the tests caught and that were fixed before delivery: a logo link whose label didn't contain its visible text (WCAG 2.5.3); a mobile-menu link that didn't scroll because Radix's focus return cancelled the smooth scroll; invalid ARIA on a chart; and a strict-CSP violation caused by Zod's `eval` probe.

### What I can't claim

Whether this *raises enrolments*. That needs Cynbit's own baseline. The prototype ships with the instrumentation and an experiment design, and makes **no conversion-lift prediction**.

**Suggested experiment:** split `/bitelevate/paths` 50/50 between the current form and this flow for 2–3 weeks. Primary metric: enrolments per 100 unique visitors. Guardrail: total lead volume.

## 7. Reviewer's 2-minute tour

1. **Landing** → press *See a sample plan*. The card on the landing page is generated by the real engine, not mocked.
2. **Build a plan** → pick *Final year · I know the basics · Land my first tech job*, choose **Blockchain**, finish the quiz. Notice the *"No dedicated lab yet"* label up front, and the honest note on the plan.
3. **Open the share link in a private window.** It works with no session. View the page source: the preview tags are in the HTML a crawler sees.
4. **Talk to an advisor** → submit with consent, then press **Delete my details**. (If email isn't configured, the form never offers or promises one.)
5. **`/admin`** (password in your environment; `admin` in development) → funnel, quiz drop-off, and the ranked *Interests with no lab yet*.
6. **On a phone**, notice the price and *Enrol* action on the first screen of a plan.

## 8. Run it, test it, deploy it

Requires Node 20+.

```bash
npm install
cp .env.example .env        # optional in development
npm run dev                 # API on :4000, client on :5173 (proxied)
```

With no `MONGODB_URI`, development starts a **throwaway in-memory MongoDB** so nothing needs installing (the first run downloads a `mongod` binary, ~600 MB, cached afterwards). The development admin password is `admin`.

| Command | What it does |
|---|---|
| `npm run dev` | API + client with hot reload |
| `npm run build` / `npm start` | Production build; API and built client served from one Node process |
| `npm test` | Unit and API tests (shared engine, Express API against a real in-memory MongoDB) |
| `npm run e2e` | End-to-end and accessibility tests in real Chrome (run `npm run build` first) |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript across all workspaces |

| Variable | Default / notes |
|---|---|
| `MONGODB_URI` | Required in production. Empty in development → in-memory MongoDB |
| `ADMIN_PASSWORD` · `ADMIN_JWT_SECRET` | Required in production (≥ 8 and ≥ 32 characters). The server refuses to start without them |
| `PUBLIC_URL` | Public base URL; used for absolute links in previews, sitemap and emails (never the `Host` header) |
| `PORT` · `TRUST_PROXY` | `4000` · `1` (reverse-proxy hops to trust) |
| `RESEND_API_KEY` · `EMAIL_FROM` | Optional. Emailing the plan is offered **only** if both and `PUBLIC_URL` are set |
| `VITE_GA_ID` · `VITE_ENROL_URL` | Optional GA4 id · where "Enrol" sends the learner |

**Deploying** is one Node service: `npm ci && npm run build`, then `npm start`. Set `MONGODB_URI` (a free MongoDB Atlas cluster works), `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET` and `PUBLIC_URL`, and serve over HTTPS (cookies are `Secure` in production). Any host that runs Node works (Render, Railway, Fly.io, a VPS).

## 9. Integrating into cynbit.in

cynbit.in is a Next.js app and this prototype is MERN, so it is **portable, not drop-in**:

1. Copy `shared/` — the engine, config and schemas are plain TypeScript.
2. Mount the wizard and plan components (React + shadcn/ui, which work inside Next.js) at `/bitelevate/paths`.
3. Turn the thin Express handlers (validate → engine → record) into Route Handlers or Server Actions.
4. Replace `saveLead()` with the existing `submitServiceLead` (`serviceType = "Custom Learning Path"`, attach the plan).
5. Make `/bitelevate` read `?lab=` so the enrolment form pre-selects the recommended lab.
6. Have mentors review `shared/src/labs.ts` and `interests.ts` — the only place the curriculum knowledge lives.

## 10. Assumptions, limitations and next steps

**Assumptions and limitations**

- Built from Cynbit's **public pages only**. No access to its analytics, database or pricing rules.
- Lab prerequisites, per-phase focus and the interest → lab mapping are **my assumptions** (marked `inferred`); program facts (60 days, 1.5–2 h/day, 14-day exam freeze, ₹1,499) come from the public page.
- Match strength compares labs *for the learner*; it's guidance, not a prediction of success.
- Rate limits are per instance (in memory); behind several instances use a shared store such as Redis.
- The admin funnel aggregates sessions in memory — fine for thousands of sessions; pre-aggregate beyond that. Single admin password; real roles are a next step. English only.
- The page is client-rendered: previews are server-rendered, but body copy isn't.

**Next steps, in order of value**

1. **Run the experiment** above on Cynbit's own traffic.
2. **Quick wins on cynbit.in** (each measured above): subset the 1.1 MB icon font with `&icon_names=` (or use inline SVG), load GA4 with `lazyOnload`, give the newsletter pop-up engagement-based triggers and keep it off forms, add a PNG `og:image`, and stop stamping every sitemap URL with the request time as `lastmod`.
3. **Carry intent through the main CTA:** reuse the engine pattern for the B2B "Start discovery" form (project type, budget, timeline) instead of a blank five-field form.
4. Mentor review of the lab config; then Hindi and shared-store rate limiting.

## How this was built

AI assistants (Claude Code) were used as a **coding and research assistant** under my direction — for scaffolding, boilerplate, scripts and review.

## Repository layout

```
shared/   engine, config, schemas, plan codec (+ unit tests)
server/   Express app, Mongoose models, routes, SEO/preload, API tests
client/   React app, shadcn/ui components, pages
e2e/      Playwright end-to-end and accessibility tests
docs/     README screenshots
```
