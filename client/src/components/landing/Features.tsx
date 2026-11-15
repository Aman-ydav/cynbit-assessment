import { CalendarRange, Compass, Gauge, Link2, Scale, ShieldCheck } from "lucide-react";
import { Section } from "@/components/site/Section";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Scale,
    title: "A match you can check",
    body: "See exactly why a lab fits — your interests, level, goal and skills — plus a runner-up and when you'd choose it instead.",
    featured: true,
  },
  {
    icon: Gauge,
    title: "Readiness and prep",
    body: "Know which core skills to brush up before Day 1, with realistic hours and a concrete task for each one.",
  },
  {
    icon: CalendarRange,
    title: "Your own 60-day timeline",
    body: "BitElevate's five phases, with what each one looks like in your lab and tips tailored to your pace and goal.",
  },
  {
    icon: Compass,
    title: "Honest about gaps",
    body: "Curious about something no lab covers yet? We say so, point to the closest lab and note the demand.",
  },
  {
    icon: Link2,
    title: "A link, not an account",
    body: "Your plan lives in a short link that carries no personal data. Send it to a friend, a mentor or your future self.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "No sign-up wall, no date of birth, no home address. Share your email only if you want a follow-up — and delete it any time.",
  },
] as const;

export function Features() {
  return (
    <Section
      id="plan"
      eyebrow="What you get"
      title="More than a quiz result"
      description="A plan you can act on today — built from BitElevate's real curriculum, with the reasoning shown."
    >
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const featured = "featured" in feature && feature.featured;
          return (
            <li
              key={feature.title}
              className={cn(
                "rounded-3xl border p-7 transition-transform duration-300 hover:-translate-y-1",
                featured
                  ? "bg-primary text-primary-foreground border-primary shadow-lift md:col-span-2 lg:col-span-1"
                  : "bg-card shadow-soft",
              )}
            >
              <span
                className={cn(
                  "grid size-12 place-items-center rounded-2xl",
                  featured ? "bg-white/15 text-white" : "bg-brand-soft text-primary",
                )}
              >
                <feature.icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-extrabold">{feature.title}</h3>
              <p
                className={cn(
                  "mt-2.5 leading-relaxed",
                  featured ? "text-primary-foreground/85" : "text-muted-foreground",
                )}
              >
                {feature.body}
              </p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
