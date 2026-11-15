import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  id: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

/** A titled card section of the plan page, labelled for assistive technology. */
export function PlanCard({ id, title, icon: Icon, children, className }: PlanCardProps) {
  const headingId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("bg-card shadow-soft scroll-mt-24 rounded-3xl border p-6 sm:p-8", className)}
    >
      <h2 id={headingId} className="flex items-center gap-3 text-xl font-extrabold sm:text-2xl">
        <span className="bg-brand-soft text-primary grid size-10 shrink-0 place-items-center rounded-xl">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
