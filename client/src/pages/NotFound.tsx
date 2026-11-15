import { ArrowRight, Compass } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found");
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="bg-brand-soft text-primary mb-6 grid size-16 place-items-center rounded-2xl">
        <Compass className="size-8" aria-hidden="true" />
      </span>
      <h1 className="text-4xl font-extrabold">This page took a wrong turn</h1>
      <p className="text-muted-foreground mt-4">
        The link may be broken or the plan code may be incomplete. You can build a fresh plan in
        about 90 seconds.
      </p>
      <Button asChild size="xl" className="mt-8">
        <Link to="/path">
          Build my plan <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
    </section>
  );
}
