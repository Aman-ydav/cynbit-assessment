# BitElevate Path Generator

A working prototype of an instant, explainable, personalised 60-day plan for the BitElevate
internship — built as an improvement proposal for Cynbit Technologies.

**Stack:** MongoDB · Express · React · Node.js — with [shadcn/ui](https://ui.shadcn.com) on Tailwind CSS v4.

> Work in progress. Full documentation (problem statement, architecture, results and the
> integration guide) is added in the final commits.

## Repository layout

```
shared/   framework-agnostic path engine, schemas and codec (TypeScript)
server/   Express API + MongoDB (Mongoose)
client/   React (Vite) UI built with shadcn/ui
```

## Getting started

```bash
npm install
cp .env.example .env        # optional in development
npm run dev                 # API on :4000, client on :5173
```

In development, if `MONGODB_URI` is empty the server starts a throwaway in-memory MongoDB, so
no database setup is needed.
