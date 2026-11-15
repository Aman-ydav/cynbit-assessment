import { encodeAnswers } from "@bitelevate/shared";
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  StepAbout,
  StepGoal,
  StepInterests,
  StepSkills,
  StepTime,
} from "@/components/wizard/steps";
import { STEPS, STEP_COUNT, clearSaved, toAnswers } from "@/components/wizard/draft";
import { useWizard } from "@/components/wizard/useWizard";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ApiError, api } from "@/lib/api";
import { getSessionId, track } from "@/lib/analytics";

export default function Wizard() {
  usePageTitle("Build your plan");
  const navigate = useNavigate();
  const { draft, step, update, goTo, canContinue } = useWizard();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    track("path_started");
  }, []);

  // Move focus to the new question on every step change, so keyboard and screen-reader users
  // land where the content is. (Skipped on first render to avoid stealing focus on page load.)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const isLast = step === STEP_COUNT - 1;
  const current = STEPS[step];

  async function submit() {
    const answers = toAnswers(draft);
    if (!answers) {
      setError("Some answers are missing. Please go back and complete each step.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { code, plan } = await api.createPlan(answers, getSessionId());
      clearSaved();
      navigate(`/plan/${code}`, { state: { plan } });
    } catch (caught) {
      if (caught instanceof ApiError && caught.isUnavailable) {
        // A plan is a pure function of the answers, so it can be built without the server.
        clearSaved();
        toast.info("Couldn't reach the server, so we built your plan on your device.");
        navigate(`/plan/${encodeAnswers(answers)}`);
        return;
      }
      setError(
        caught instanceof ApiError && caught.status === 429
          ? "You've made a lot of requests. Please wait a minute and try again."
          : "Something went wrong while building your plan. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    track("step_completed", { step: step + 1 });
    if (isLast) void submit();
    else goTo(step + 1);
  }

  return (
    <div className="hero-glow min-h-[calc(100svh-4rem)]">
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-28 sm:px-6 sm:pt-12 sm:pb-16">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold">
            <span className="text-primary font-heading tracking-wide uppercase">
              Step {step + 1} of {STEP_COUNT} · {current.short}
            </span>
            <span className="text-muted-foreground hidden sm:inline">About 90 seconds</span>
          </div>
          <Progress
            value={((step + 1) / STEP_COUNT) * 100}
            aria-label={`Step ${step + 1} of ${STEP_COUNT}`}
            className="h-2"
          />
        </div>

        <div aria-live="polite" className="sr-only">
          Step {step + 1} of {STEP_COUNT}: {current.title}
        </div>

        {/* Step */}
        <div key={step} className="animate-rise">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl font-extrabold outline-none sm:text-4xl"
          >
            {current.title}
          </h1>
          <p className="text-muted-foreground mt-3 mb-8 text-sm">
            Nothing you enter here identifies you — no name or email is needed to see your plan.
          </p>

          {step === 0 && <StepAbout draft={draft} update={update} />}
          {step === 1 && <StepGoal draft={draft} update={update} />}
          {step === 2 && <StepInterests draft={draft} update={update} />}
          {step === 3 && <StepTime draft={draft} update={update} />}
          {step === 4 && <StepSkills draft={draft} update={update} />}
        </div>

        {error && (
          <Alert variant="destructive" className="mt-8">
            <AlertCircle />
            <AlertTitle>We couldn&rsquo;t build your plan</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions: sticky on phones so they never scroll out of reach */}
        <div className="bg-background/90 fixed inset-x-0 bottom-0 z-20 border-t px-4 py-3 backdrop-blur-lg sm:static sm:mt-10 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            {step === 0 ? (
              <Button asChild variant="ghost" size="lg">
                <Link to="/">
                  <ArrowLeft /> Cancel
                </Link>
              </Button>
            ) : (
              <Button type="button" variant="outline" size="lg" onClick={() => goTo(step - 1)} disabled={submitting}>
                <ArrowLeft /> Back
              </Button>
            )}

            <div className="flex items-center gap-4">
              {!canContinue && (
                <p className="text-muted-foreground hidden text-sm sm:block">
                  Choose an option in each group to continue
                </p>
              )}
              <Button
                type="button"
                size="lg"
                onClick={next}
                disabled={!canContinue || submitting}
                className="min-w-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" /> Building…
                  </>
                ) : isLast ? (
                  <>
                    <Sparkles /> Show my plan
                  </>
                ) : (
                  <>
                    Continue <ArrowRight data-icon="inline-end" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
