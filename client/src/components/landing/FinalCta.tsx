import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="bg-primary text-primary-foreground shadow-lift relative overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12 sm:py-20">
        <div
          className="bg-brand-glow/20 absolute -top-24 -right-16 size-72 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold sm:text-5xl">
            Ready to see your plan?
          </h2>
          <p className="text-primary-foreground/85 mx-auto mt-4 max-w-xl text-lg">
            Five questions, about 90 seconds, no sign-up.
          </p>
          <Button asChild size="xl" variant="secondary" className="mt-9 bg-white text-primary hover:bg-white/90">
            <Link to="/path">
              Build my plan <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
