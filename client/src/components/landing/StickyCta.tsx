import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * On phones the primary action must never be a long scroll away. Once the hero buttons leave the
 * screen, a compact bar keeps "Build my plan" one tap away. Hidden on larger screens.
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("hero-cta");
    if (!target || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      // Show only after the hero buttons have scrolled off the top, not while still below the fold.
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "no-print bg-background/90 fixed inset-x-0 bottom-0 z-30 border-t p-3 backdrop-blur-lg transition-transform duration-300 sm:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      aria-hidden={!visible}
    >
      <Button asChild size="xl" className="w-full" tabIndex={visible ? 0 : -1}>
        <Link to="/path">
          Build my plan <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
    </div>
  );
}
