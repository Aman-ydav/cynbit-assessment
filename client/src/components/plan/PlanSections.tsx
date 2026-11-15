import {
  LABS,
  matchLabel,
  type Alternate,
  type Plan,
  type TimelineStep,
  type UnmatchedInterest,
} from "@bitelevate/shared";
import {
  Check,
  CircleHelp,
  Compass,
  Gauge,
  GitPullRequest,
  Info,
  Lightbulb,
  ListChecks,
  Route,
  Sparkles,
  Trophy,
  Wrench,
} from "lucide-react";
import { PlanCard } from "@/components/plan/PlanCard";
import { ReadinessRing } from "@/components/plan/ReadinessRing";
import { Badge } from "@/components/ui/badge";
import { LAB_ICON, LAB_TINT } from "@/lib/lab-visuals";
import { cn } from "@/lib/utils";

/* ── Why this lab ─────────────────────────────────────────────────────────── */

export function WhyCard({ plan }: { plan: Plan }) {
  const lab = LABS[plan.primary.labId];
  return (
    <PlanCard id="why" title="Why this lab fits you" icon={Sparkles}>
      <div className="flex items-center justify-between gap-4">
        <p className="font-bold">{matchLabel(plan.primary.matchPct)}</p>
        <p className="font-heading text-primary text-2xl font-extrabold">{plan.primary.matchPct}%</p>
      </div>
      <div
        className="bg-muted mt-2 h-3 overflow-hidden rounded-full"
        role="meter"
        aria-label={`Match strength for ${lab.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={plan.primary.matchPct}
      >
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${plan.primary.matchPct}%` }}
        />
      </div>

      <ul className="mt-6 space-y-3.5">
        {plan.primary.reasons.map((reason) => (
          <li key={reason} className="flex gap-3 leading-snug">
            <span className="bg-success-soft text-success mt-0.5 grid size-6 shrink-0 place-items-center rounded-full">
              <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
            </span>
            {reason}
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground mt-6 border-t pt-4 text-sm">
        Match strength compares the six labs for you. It is guidance based on your answers — not a
        prediction of how you will do.
      </p>
    </PlanCard>
  );
}

/* ── Readiness & prep ─────────────────────────────────────────────────────── */

export function ReadinessCard({ plan }: { plan: Plan }) {
  const { readiness, schedule } = plan;
  return (
    <PlanCard id="readiness" title="Are you ready to start?" icon={Gauge}>
      <div className="flex items-center gap-5">
        <ReadinessRing score={readiness.score} band={readiness.band} size={84} />
        <div>
          <p className="font-heading text-lg font-extrabold">{readiness.headline}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {readiness.gaps.length === 0
              ? "You already have every core skill this lab builds on."
              : `${readiness.gaps.length} core skill${readiness.gaps.length === 1 ? "" : "s"} to brush up — about ${schedule.prepHours} hours of practice.`}
          </p>
        </div>
      </div>

      {readiness.gaps.length > 0 && (
        <ul className="mt-6 space-y-3">
          {readiness.gaps.map((gap) => (
            <li key={gap.skill} className="bg-muted rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">{gap.label}</p>
                <Badge variant="outline" className="bg-card shrink-0 font-semibold">
                  ~{gap.hours} h
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{gap.tip}</p>
            </li>
          ))}
        </ul>
      )}

      {readiness.owned.length > 0 && (
        <div className="mt-6">
          <p className="text-muted-foreground mb-2 text-sm font-semibold">You already have</p>
          <ul className="flex flex-wrap gap-2">
            {readiness.owned.map((skill) => (
              <li
                key={skill.skill}
                className="bg-success-soft text-success inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
              >
                <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                {skill.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {readiness.optionalGaps.length > 0 && (
        <p className="text-muted-foreground mt-5 text-sm">
          <strong className="text-foreground">Helpful, not required:</strong>{" "}
          {readiness.optionalGaps.map((gap) => gap.label).join(", ")}.
        </p>
      )}
    </PlanCard>
  );
}

/* ── Timeline ─────────────────────────────────────────────────────────────── */

function TimelineItem({ step, index, labName }: { step: TimelineStep; index: number; labName: string }) {
  const isPrep = step.kind === "prep";
  return (
    <li className="relative pl-14">
      <span
        className={cn(
          "ring-card absolute top-0 left-0 grid size-10 place-items-center rounded-full ring-4",
          isPrep ? "bg-amber-soft text-amber" : "bg-primary text-primary-foreground",
        )}
        aria-hidden="true"
      >
        {isPrep ? <Wrench className="size-4.5" /> : <span className="font-heading font-extrabold">{index}</span>}
      </span>

      <div className="rounded-2xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold">{step.title}</h3>
          <Badge variant="secondary" className="font-semibold">
            {step.period}
          </Badge>
        </div>
        <p className="text-primary mt-1 text-sm font-bold">{step.focus}</p>
        <p className="text-muted-foreground mt-2 leading-relaxed">{step.summary}</p>

        {step.labFocus && (
          <div className="bg-brand-soft mt-4 rounded-xl p-4">
            <p className="text-primary text-xs font-bold tracking-wide uppercase">In the {labName}</p>
            <p className="mt-1 leading-relaxed">{step.labFocus}</p>
          </div>
        )}

        {step.items.length > 0 && (
          <ul className="mt-4 space-y-2">
            {step.items.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                <Lightbulb className="text-amber mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function TimelineCard({ plan }: { plan: Plan }) {
  const lab = LABS[plan.primary.labId];
  let phaseNumber = 0;
  return (
    <PlanCard id="timeline" title="Your 60-day timeline" icon={Route}>
      <ol className="before:bg-border relative space-y-5 before:absolute before:top-3 before:bottom-3 before:left-5 before:w-px">
        {plan.timeline.map((step) => {
          if (step.kind === "phase") phaseNumber += 1;
          return <TimelineItem key={step.id} step={step} index={phaseNumber} labName={lab.name} />;
        })}
      </ol>
    </PlanCard>
  );
}

/* ── What you'll ship ─────────────────────────────────────────────────────── */

export function ShipsCard({ plan }: { plan: Plan }) {
  const lab = LABS[plan.primary.labId];
  return (
    <PlanCard id="ships" title="What you'll ship and take away" icon={GitPullRequest}>
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h3 className="font-heading mb-3 text-sm font-bold tracking-wide uppercase">
            You'll ship
          </h3>
          <ul className="space-y-3">
            {lab.ships.map((item) => (
              <li key={item} className="flex gap-2.5 leading-snug">
                <ListChecks className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-heading mb-3 text-sm font-bold tracking-wide uppercase">
            You'll leave with
          </h3>
          <ul className="space-y-3">
            {plan.outcomes.map((item) => (
              <li key={item} className="flex gap-2.5 leading-snug">
                <Trophy className="text-amber mt-0.5 size-5 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-muted-foreground mt-6 border-t pt-4 text-sm">
        Based on the public BitElevate curriculum. Cynbit&rsquo;s mentors set the exact tasks for
        each lab.
      </p>
    </PlanCard>
  );
}

/* ── Alternates ───────────────────────────────────────────────────────────── */

function AlternateItem({ alternate }: { alternate: Alternate }) {
  const lab = LABS[alternate.labId];
  const Icon = LAB_ICON[lab.id];
  return (
    <li className="rounded-2xl border p-5">
      <div className="flex items-start gap-4">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", LAB_TINT[lab.id])}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-extrabold">{lab.name}</h3>
            <span className="font-heading text-muted-foreground shrink-0 font-extrabold">
              {alternate.matchPct}%
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{lab.project}</p>
        </div>
      </div>
      {alternate.reasons[0] && (
        <p className="mt-3 text-sm leading-relaxed">{alternate.reasons[0]}</p>
      )}
      <p className="mt-2 text-sm leading-relaxed">
        <span className="text-primary font-bold">Choose it instead if </span>
        <span className="text-muted-foreground">
          {alternate.chooseIf.charAt(0).toLowerCase() + alternate.chooseIf.slice(1)}
        </span>
      </p>
    </li>
  );
}

export function AlternatesCard({ alternates }: { alternates: Alternate[] }) {
  if (alternates.length === 0) return null;
  return (
    <PlanCard id="alternatives" title="Other labs worth a look" icon={CircleHelp}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {alternates.map((alternate) => (
          <AlternateItem key={alternate.labId} alternate={alternate} />
        ))}
      </ul>
    </PlanCard>
  );
}

/* ── Good to know (unmatched interests + notes) ───────────────────────────── */

export function GoodToKnowCard({
  unmatched,
  notes,
}: {
  unmatched: UnmatchedInterest[];
  notes: string[];
}) {
  if (unmatched.length === 0 && notes.length === 0) return null;
  return (
    <PlanCard id="notes" title="Good to know" icon={Info}>
      <ul className="space-y-4">
        {unmatched.map((item) => (
          <li key={item.id} className="bg-warning-soft flex gap-3 rounded-2xl p-4 leading-relaxed">
            <Compass className="text-amber mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span>{item.message}</span>
          </li>
        ))}
        {notes.map((note) => (
          <li key={note} className="bg-muted flex gap-3 rounded-2xl p-4 leading-relaxed">
            <Info className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </PlanCard>
  );
}
