import { CalendarRange, Check, Clock } from "lucide-react";
import { LABS, matchLabel } from "@bitelevate/shared";
import { PhaseBar } from "@/components/plan/PhaseBar";
import { ReadinessRing } from "@/components/plan/ReadinessRing";
import { Badge } from "@/components/ui/badge";
import { LAB_ICON, LAB_TINT } from "@/lib/lab-visuals";
import { SAMPLE_PLAN } from "@/lib/sample";
import { cn } from "@/lib/utils";

/**
 * A live preview of the product. Everything here comes from the real engine run on a sample
 * learner — there are no invented numbers on this card.
 */
export function SamplePlanCard({ className }: { className?: string }) {
  const plan = SAMPLE_PLAN;
  const lab = LABS[plan.primary.labId];
  const Icon = LAB_ICON[lab.id];

  return (
    <div className={cn("relative", className)}>
      <div
        className="from-brand-glow/50 absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br to-transparent blur-2xl"
        aria-hidden="true"
      />
      <article
        className="bg-card shadow-lift rounded-3xl border p-5 sm:p-7"
        aria-label="Sample personalised plan"
      >
        <header className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground font-heading text-xs font-bold tracking-[0.14em] uppercase">
            Sample plan
          </span>
          <Badge variant="secondary" className="font-bold">
            {matchLabel(plan.primary.matchPct)}
          </Badge>
        </header>

        <div className="mt-5 flex items-start gap-4">
          <span className={cn("grid size-14 shrink-0 place-items-center rounded-2xl", LAB_TINT[lab.id])}>
            <Icon className="size-7" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-sm font-semibold">Best-fit lab</p>
            <p className="font-heading mt-0.5 text-xl leading-tight font-extrabold sm:text-2xl">{lab.name}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {lab.project} · {lab.tagline}
            </p>
          </div>
          <div className="text-right">
            <p className="font-heading text-primary text-3xl leading-none font-extrabold">
              {plan.primary.matchPct}%
            </p>
            <p className="text-muted-foreground mt-1 text-xs font-semibold">match</p>
          </div>
        </div>

        <ul className="mt-6 space-y-2.5" aria-label="Why this lab">
          {plan.primary.reasons.slice(0, 3).map((reason) => (
            <li key={reason} className="flex gap-2.5 text-sm leading-snug">
              <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-sm font-bold">Your 60-day roadmap</p>
            <p className="text-muted-foreground text-xs font-semibold">5 phases</p>
          </div>
          <PhaseBar />
        </div>

        <footer className="bg-muted mt-6 grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl p-4">
          <ReadinessRing score={plan.readiness.score} band={plan.readiness.band} size={64} />
          <div className="space-y-1.5 text-sm">
            <p className="font-bold">{plan.readiness.headline}</p>
            <p className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden="true" />
              About {plan.schedule.prepDays} days of prep first
            </p>
            <p className="text-muted-foreground flex items-center gap-1.5">
              <CalendarRange className="size-3.5" aria-hidden="true" />
              ~{plan.schedule.totalCalendarWeeks} weeks start to finish
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}
