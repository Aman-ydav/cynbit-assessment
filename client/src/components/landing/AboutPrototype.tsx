import { ExternalLink, GitBranch } from "lucide-react";
import { Section } from "@/components/site/Section";
import { REPO_URL } from "@/lib/config";

const STACK = ["MongoDB", "Express", "React", "Node.js", "shadcn/ui", "TypeScript"];

export function AboutPrototype() {
  return (
    <div className="bg-muted/60 border-y">
      <Section
        id="about"
        eyebrow="About this prototype"
        title="Making “Generate My Custom Path” generate a path"
      >
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="bg-card shadow-soft space-y-4 rounded-3xl border p-7 leading-relaxed">
            <p>
              This is a working prototype of the <strong>Generate My Custom Path</strong> flow on
              cynbit.in/bitelevate/paths. As of 15 November 2026 that button opens a form that
              collects a lead and promises a reply within 24 hours.
            </p>
            <p className="text-muted-foreground">
              Here the answer is instant and explained, the lab choice is guided instead of a bare
              dropdown, and contact details are requested only after the learner has seen their plan.
              Every step reports anonymous funnel events, so the effect on enrolments can actually
              be measured.
            </p>
          </div>

          <div className="bg-card shadow-soft rounded-3xl border p-7">
            <h3 className="font-heading text-sm font-bold tracking-wide uppercase">Built with</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {STACK.map((item) => (
                <li
                  key={item}
                  className="bg-brand-soft text-primary rounded-full px-3 py-1.5 text-sm font-bold"
                >
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary mt-6 inline-flex items-center gap-2 font-bold underline-offset-4 hover:underline"
            >
              <GitBranch className="size-4" aria-hidden="true" />
              View the source on GitHub
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </Section>
    </div>
  );
}
