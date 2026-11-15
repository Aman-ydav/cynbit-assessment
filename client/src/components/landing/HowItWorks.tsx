import { ClipboardList, Rocket, Route } from "lucide-react";
import { Section } from "@/components/site/Section";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Tell us about you",
    body: "Your level, goal, interests and daily time. Five short steps, about 90 seconds — and nothing you type is stored with your name.",
  },
  {
    icon: Route,
    title: "Get your match and roadmap",
    body: "A recommended lab with the reasons why, a readiness check and a 60-day timeline built from BitElevate's five phases.",
  },
  {
    icon: Rocket,
    title: "Decide with confidence",
    body: "Share the plan, talk to an advisor or enrol on cynbit.in. Contact details are optional and only asked after you've seen your plan.",
  },
] as const;

export function HowItWorks() {
  return (
    <Section
      id="how"
      eyebrow="How it works"
      title="From “which lab?” to a plan, in three steps"
      description="No account, no waiting for an email. You get the answer first; we ask for anything else afterwards."
    >
      <ol className="grid gap-5 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="bg-card shadow-soft relative rounded-3xl border p-7 transition-transform duration-300 hover:-translate-y-1"
          >
            <span className="bg-brand-soft text-primary grid size-12 place-items-center rounded-2xl">
              <step.icon className="size-6" aria-hidden="true" />
            </span>
            <span
              className="font-heading text-muted-foreground/25 absolute top-5 right-6 text-5xl font-extrabold"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <h3 className="mt-6 text-xl font-extrabold">{step.title}</h3>
            <p className="text-muted-foreground mt-2.5 leading-relaxed">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
