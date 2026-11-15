import { LABS, type Plan } from "@bitelevate/shared";
import { ArrowUpRight, CalendarDays, Clock, MessageCircleQuestion, Timer, Wrench } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { enrolUrl } from "@/lib/config";
import { formatInr, plural } from "@/lib/format";

interface EnrolCardProps {
  plan: Plan;
  onAdvisor: () => void;
}

/** Price, the call to action and the schedule at a glance. Sticky beside the plan on desktop. */
export function EnrolCard({ plan, onAdvisor }: EnrolCardProps) {
  const lab = LABS[plan.enrol.labId];
  const { schedule } = plan;

  const stats = [
    {
      icon: Wrench,
      label: "Prep first",
      value: schedule.prepDays > 0 ? `~${plural(schedule.prepDays, "day")}` : "None needed",
    },
    { icon: CalendarDays, label: "The sprint", value: `${schedule.sprintDays} days` },
    { icon: Clock, label: "Your time", value: `${schedule.hoursPerDay} h / day` },
    {
      icon: Timer,
      label: "Start to finish",
      value: `~${plural(schedule.totalCalendarWeeks, "week")}`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-card shadow-lift rounded-3xl border p-6">
        <p className="text-muted-foreground text-sm font-semibold">Your recommended lab</p>
        <p className="font-heading mt-1 text-lg font-extrabold">{lab.name}</p>

        <p className="mt-5 flex items-baseline gap-2.5">
          <span className="font-heading text-4xl font-extrabold">{formatInr(plan.enrol.priceInr)}</span>
          <span className="text-muted-foreground text-lg line-through">
            {formatInr(plan.enrol.listPriceInr)}
          </span>
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          One-time fee for all 60 days, as listed on cynbit.in.
        </p>

        <Button asChild size="xl" className="mt-5 w-full">
          <a
            href={enrolUrl(lab.id)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("enrol_clicked", { lab: lab.id, match: plan.primary.matchPct })}
          >
            Enrol on cynbit.in <ArrowUpRight data-icon="inline-end" />
          </a>
        </Button>
        <p className="text-muted-foreground mt-3 text-center text-sm">
          In the enrolment form, choose <strong className="text-foreground">{lab.name}</strong>.
        </p>

        <Button type="button" variant="outline" size="lg" className="mt-4 w-full" onClick={onAdvisor}>
          <MessageCircleQuestion /> Talk to an advisor first
        </Button>
      </div>

      <div className="bg-card shadow-soft rounded-3xl border p-6">
        <h2 className="font-heading text-sm font-bold tracking-wide uppercase">Schedule at a glance</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-muted rounded-2xl p-3.5">
              <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
                <stat.icon className="size-3.5" aria-hidden="true" />
                {stat.label}
              </dt>
              <dd className="font-heading mt-1 text-lg leading-tight font-extrabold">{stat.value}</dd>
            </div>
          ))}
        </dl>

        {schedule.freezeDays > 0 && (
          <p className="text-muted-foreground mt-3 text-sm">
            Includes up to {schedule.freezeDays} days of exam freeze.
          </p>
        )}
        {schedule.prepCapped && (
          <p className="text-muted-foreground mt-3 text-sm">
            Your prep estimate is capped — at your pace it may take longer.
          </p>
        )}
        {schedule.pace.status !== "on_track" && (
          <Alert className="mt-4">
            <AlertDescription>{schedule.pace.message}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
