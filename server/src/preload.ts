import fs from "node:fs";
import path from "node:path";

/**
 * Resource hints for the single-page app shell.
 *
 * Without hints, a deep link such as /plan/abc loads like a relay race: HTML → app bundle →
 * (router decides) → the Plan chunk → its dependencies, and fonts are only requested once text
 * is about to paint — so text first renders in a fallback font and then jumps when the real one
 * arrives (layout shift). Because the server already knows the route, it can start all of that
 * in parallel by preloading the route's chunks (from Vite's build manifest) and the Latin fonts.
 */
interface ManifestEntry {
  file: string;
  imports?: string[];
}
type Manifest = Record<string, ManifestEntry>;

/** Route → the manifest key of the lazily loaded page component that renders it. */
const ROUTES: [RegExp, string][] = [
  [/^\/path\/?$/, "src/pages/Wizard.tsx"],
  [/^\/plan\/[^/]+\/?$/, "src/pages/Plan.tsx"],
  [/^\/admin\/?$/, "src/pages/Admin.tsx"],
  [/^\/privacy\/?$/, "src/pages/Privacy.tsx"],
];

const attr = (value: string) => value.replace(/"/g, "&quot;");

function readManifest(distDir: string): Manifest | null {
  for (const candidate of [".vite/manifest.json", "manifest.json"]) {
    try {
      return JSON.parse(fs.readFileSync(path.join(distDir, candidate), "utf8")) as Manifest;
    } catch {
      /* try the next location */
    }
  }
  return null;
}

/** A chunk plus everything it statically imports. */
function closure(manifest: Manifest, key: string, seen = new Set<string>()): string[] {
  const entry = manifest[key];
  if (!entry || seen.has(key)) return [];
  seen.add(key);
  return [entry.file, ...(entry.imports ?? []).flatMap((next) => closure(manifest, next, seen))];
}

export interface Preloader {
  /** Extra <head> tags for a request path; empty string when there is nothing useful to add. */
  headFor(pathname: string): string;
}

export function createPreloader(distDir: string, shellHtml: string): Preloader {
  const manifest = readManifest(distDir);

  // Latin-subset variable fonts are used on every page, so they are always worth preloading.
  let fonts: string[] = [];
  try {
    fonts = fs
      .readdirSync(path.join(distDir, "assets"))
      .filter((name) => /-latin-wght-normal-.*\.woff2$/.test(name))
      .map((name) => `/assets/${name}`);
  } catch {
    /* no assets directory (tests, API-only mode) */
  }
  const fontTags = fonts.map(
    (href) => `    <link rel="preload" href="${attr(href)}" as="font" type="font/woff2" crossorigin />`,
  );

  // Anything the shell already loads or preloads doesn't need repeating.
  const alreadyInShell = new Set(
    [...shellHtml.matchAll(/(?:href|src)="(\/assets\/[^"]+)"/g)].map((match) => match[1] as string),
  );

  const cache = new Map<string, string>();

  return {
    headFor(pathname) {
      const hit = cache.get(pathname);
      if (hit !== undefined) return hit;

      const tags = [...fontTags];
      const route = ROUTES.find(([pattern]) => pattern.test(pathname));
      if (manifest && route) {
        const files = [...new Set(closure(manifest, route[1]))]
          .map((file) => `/${file}`)
          .filter((href) => !alreadyInShell.has(href));
        for (const href of files) {
          tags.push(`    <link rel="modulepreload" crossorigin href="${attr(href)}" />`);
        }
      }

      const result = tags.join("\n");
      // Bounded: only a handful of distinct route shapes exist, but never grow without limit.
      if (cache.size < 50) cache.set(pathname, result);
      return result;
    },
  };
}
