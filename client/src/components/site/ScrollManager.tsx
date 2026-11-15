import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { trackPageView } from "@/lib/analytics";

/** Radix (react-remove-scroll) marks <body> with this while a modal such as the menu is open. */
const isScrollLocked = () => document.body.hasAttribute("data-scroll-locked");

/**
 * Single-page apps don't scroll or move focus on navigation by default.
 * - Hash links (/#labs) scroll to the target section — including from the mobile menu, which
 *   locks body scrolling while it closes, so we wait for the lock to release first.
 * - Route changes reset scroll and move focus to <main> so screen-reader and keyboard
 *   users land at the top of the new page.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  const previousPath = useRef(pathname);
  const firstLoad = useRef(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pathChanged = previousPath.current !== pathname;
    previousPath.current = pathname;
    if (pathChanged || firstLoad.current) trackPageView(pathname);
    firstLoad.current = false;

    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        const scroll = () =>
          target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });

        if (!isScrollLocked()) {
          scroll();
          return;
        }
        // Wait (briefly) for the closing modal to release the scroll lock, then scroll.
        let waited = 0;
        const timer = window.setInterval(() => {
          waited += 50;
          if (!isScrollLocked() || waited >= 1500) {
            window.clearInterval(timer);
            scroll();
          }
        }, 50);
        return () => window.clearInterval(timer);
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (pathChanged) document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname, hash]);

  return null;
}
