import { useCallback, useEffect, useState } from "react";
import { STEP_COUNT, isStepComplete, loadSaved, type Draft } from "@/components/wizard/draft";

const STORAGE_KEY = "bitelevate.draft";

/** Wizard state with progress saved per tab, so a refresh or accidental back doesn't lose answers. */
export function useWizard() {
  const [{ draft, step }, setState] = useState(loadSaved);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, step }));
    } catch {
      /* storage may be unavailable */
    }
  }, [draft, step]);

  const update = useCallback(
    (patch: Partial<Draft>) => setState((s) => ({ ...s, draft: { ...s.draft, ...patch } })),
    [],
  );
  const goTo = useCallback(
    (next: number) => setState((s) => ({ ...s, step: Math.min(Math.max(0, next), STEP_COUNT - 1) })),
    [],
  );

  return { draft, step, update, goTo, canContinue: isStepComplete(step, draft) };
}
