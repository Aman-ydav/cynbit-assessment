import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router";
import { SamplePlanCard } from "@/components/landing/SamplePlanCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SAMPLE_CODE } from "@/lib/sample";

const POINTS = [
  "Explained, not a black box",
  "Free to try — no sign-up",
  "Built on the real BitElevate curriculum",
];

export function Hero() {
  return (
    <section className="hero-glow relative overflow-hidden border-b">
      <div className="grid-fade pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <Badge
            variant="secondary"
            className="animate-rise bg-card border-border h-8 gap-2 border px-3.5 text-[0.8rem] font-bold shadow-soft"
          >
            <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />
            BitElevate · 60-day remote engineering internship
          </Badge>

          <h1
            className="animate-rise mt-6 text-[2.55rem] leading-[1.05] font-extrabold sm:text-6xl lg:text-[4.1rem]"
            style={{ animationDelay: "70ms" }}
          >
            Find the lab that fits you.{" "}
            <span className="text-primary">Get your 60-day plan</span> in 90 seconds.
          </h1>

          <p
            className="animate-rise text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed"
            style={{ animationDelay: "140ms" }}
          >
            Answer five quick questions. We match you to one of BitElevate&rsquo;s six engineering
            labs and build a day-by-day roadmap around your level, goal and time.
          </p>

          <div
            id="hero-cta"
            className="animate-rise mt-9 flex flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "210ms" }}
          >
            <Button asChild size="xl">
              <Link to="/path">
                Build my plan <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="bg-card">
              <Link to={`/plan/${SAMPLE_CODE}`}>See a sample plan</Link>
            </Button>
          </div>

          <ul
            className="animate-rise mt-9 flex flex-col gap-2.5 text-sm font-semibold sm:flex-row sm:flex-wrap sm:gap-x-6"
            style={{ animationDelay: "280ms" }}
          >
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span className="bg-success-soft text-success grid size-5 place-items-center rounded-full">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <SamplePlanCard className="animate-rise" />
      </div>
    </section>
  );
}
