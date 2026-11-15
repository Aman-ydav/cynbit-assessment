import { LABS, type Plan } from "@bitelevate/shared";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { enrolUrl } from "@/lib/config";
import { formatInr } from "@/lib/format";

/**
 * Phones don't have the sticky sidebar, so the price and enrol action ride along at the bottom.
 * (On cynbit.in the price sits ~11 screens down the page on mobile.)
 */
export function StickyEnrol({ plan }: { plan: Plan }) {
  const lab = LABS[plan.enrol.labId];
  return (
    <div className="no-print bg-background/90 fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3 backdrop-blur-lg lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-4">
        <div className="min-w-0 leading-tight">
          <p className="font-heading text-xl font-extrabold">{formatInr(plan.enrol.priceInr)}</p>
          <p className="text-muted-foreground truncate text-xs font-semibold">{lab.shortName} Lab · 60 days</p>
        </div>
        <Button asChild size="lg" className="ml-auto shrink-0">
          <a
            href={enrolUrl(lab.id)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("enrol_clicked", { lab: lab.id, match: plan.primary.matchPct, from: "sticky" })}
          >
            Enrol <ArrowUpRight data-icon="inline-end" />
          </a>
        </Button>
      </div>
    </div>
  );
}
