import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/**
 * Single-page apps don't scroll or move focus on navigation by default.
 * - Hash links (/#labs) scroll to the target section.
 * - Route changes reset scroll and move focus to <main> so screen-reader and keyboard
 *   users land at the top of the new page.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pathChanged = previousPath.current !== pathname;
    previousPath.current = pathname;

    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (pathChanged) document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname, hash]);

  return null;
}
