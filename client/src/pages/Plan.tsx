import {
  LABS,
  LEVEL_LABEL,
  encodeAnswers,
  matchLabel,
  planFromCode,
  type Plan as PlanData,
} from "@bitelevate/shared";
import { ArrowRight, MessageCircleQuestion, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { AnswersRecap } from "@/components/plan/AnswersRecap";
import { EnrolCard } from "@/components/plan/EnrolCard";
import { LeadDialog } from "@/components/plan/LeadDialog";
import {
  AlternatesCard,
  GoodToKnowCard,
  ReadinessCard,
  ShipsCard,
  TimelineCard,
  WhyCard,
} from "@/components/plan/PlanSections";
import { ShareBar } from "@/components/plan/ShareBar";
import { StickyEnrol } from "@/components/plan/StickyEnrol";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { track } from "@/lib/analytics";
import { LAB_ICON, LAB_TINT } from "@/lib/lab-visuals";
import { cn } from "@/lib/utils";

/**
 * Prefer the plan the server just generated (passed through router state); otherwise rebuild it
 * from the share code. A plan is a pure function of the answers, so both are identical — and a
 * shared link works instantly, offline-tolerant, and never expires.
 */
function resolvePlan(code: string, state: unknown): PlanData | null {
  const fromServer = (state as { plan?: PlanData } | null)?.plan;
  if (fromServer && encodeAnswers(fromServer.answers) === code) return fromServer;
  return planFromCode(code);
}

function InvalidPlan() {
  usePageTitle("Plan link not valid");
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="bg-brand-soft text-primary mb-6 grid size-16 place-items-center rounded-2xl">
        <Undo2 className="size-8" aria-hidden="true" />
      </span>
      <h1 className="text-3xl font-extrabold sm:text-4xl">This plan link isn&rsquo;t valid</h1>
      <p className="text-muted-foreground mt-4">
        It may have been copied incompletely. Building a fresh plan takes about 90 seconds.
      </p>
      <Button asChild size="xl" className="mt-8">
        <Link to="/path">
          Build my plan <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
    </section>
  );
}

export default function Plan() {
  const { code = "" } = useParams();
  const location = useLocation();
  const plan = useMemo(() => resolvePlan(code, location.state), [code, location.state]);

  const [leadOpen, setLeadOpen] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  usePageTitle(plan ? `${LABS[plan.primary.labId].name} plan` : "Plan link not valid");

  useEffect(() => {
    api
      .getConfig()
      .then((config) => setEmailEnabled(config.emailEnabled))
      .catch(() => undefined); // email simply stays hidden if the server can't be reached
  }, []);

  useEffect(() => {
    if (plan) track("plan_viewed", { lab: plan.primary.labId, match: plan.primary.matchPct });
    // Report once per plan, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!plan) return <InvalidPlan />;

  const lab = LABS[plan.primary.labId];
  const Icon = LAB_ICON[lab.id];

  return (
    <>
      <div className="hero-glow border-b">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-10 sm:px-6 sm:pt-14 sm:pb-14">
          <p className="text-primary font-heading text-xs font-bold tracking-[0.16em] uppercase">
            Your personalised plan
          </p>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-start gap-4">
                <span className={cn("grid size-14 shrink-0 place-items-center rounded-2xl sm:size-16", LAB_TINT[lab.id])}>
                  <Icon className="size-7 sm:size-8" aria-hidden="true" />
                </span>
                <h1 className="text-3xl leading-[1.08] font-extrabold sm:text-5xl">
                  Your best-fit lab is the <span className="text-primary">{lab.name}</span>
                </h1>
              </div>

              <p className="text-muted-foreground mt-5 max-w-2xl text-lg leading-relaxed">{lab.summary}</p>

              <ul className="mt-5 flex flex-wrap items-center gap-2" aria-label="Lab details">
                <li>
                  <Badge className="h-7 px-3 text-sm font-bold">
                    {matchLabel(plan.primary.matchPct)} · {plan.primary.matchPct}%
                  </Badge>
                </li>
                <li>
                  <Badge variant="outline" className="bg-card h-7 px-3 text-sm font-semibold">
                    {LEVEL_LABEL[lab.level]}
                  </Badge>
                </li>
                <li>
                  <Badge variant="outline" className="bg-card h-7 px-3 text-sm font-semibold">
                    Project: {lab.project}
                  </Badge>
                </li>
              </ul>
              <ul className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
                {lab.stack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="bg-card no-print"
                  onClick={() => setLeadOpen(true)}
                >
                  <MessageCircleQuestion /> Talk to an advisor
                </Button>
                <ShareBar plan={plan} code={code} />
              </div>
            </div>

            <AnswersRecap plan={plan} />
          </div>

        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-10 pb-32 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10 lg:pb-16">
        <div className="min-w-0 space-y-6">
          <WhyCard plan={plan} />
          <ReadinessCard plan={plan} />
          <TimelineCard plan={plan} />
          <ShipsCard plan={plan} />
          <AlternatesCard alternates={plan.alternates} />
          <GoodToKnowCard unmatched={plan.unmatched} notes={plan.notes} />

          <p className="text-muted-foreground px-1 text-sm">
            Want different results?{" "}
            <Link to="/path" className="text-primary font-semibold underline underline-offset-4">
              Retake the quiz
            </Link>
            .
          </p>
        </div>

        <aside className="no-print mt-8 lg:mt-0" aria-label="Enrol and schedule">
          <div className="lg:sticky lg:top-24">
            <EnrolCard plan={plan} onAdvisor={() => setLeadOpen(true)} />
          </div>
        </aside>
      </div>

      <StickyEnrol plan={plan} />
      <LeadDialog open={leadOpen} onOpenChange={setLeadOpen} planCode={code} emailEnabled={emailEnabled} />
    </>
  );
}
