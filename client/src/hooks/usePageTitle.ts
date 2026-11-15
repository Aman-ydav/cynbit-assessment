import { useEffect } from "react";

const SUFFIX = "BitElevate Path Generator";

/** Sets a unique, descriptive <title> per route (helps SEO, history and screen readers). */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : `${SUFFIX} — your personalised 60-day plan`;
  }, [title]);
}
