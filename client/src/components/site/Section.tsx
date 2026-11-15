import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}

/** Consistent section scaffolding: eyebrow → title → description → content. */
export function Section({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  className,
  children,
}: SectionProps) {
  return (
    <section id={id} className={cn("mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24", className)}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
        {eyebrow && (
          <p className="text-primary font-heading mb-3 text-xs font-bold tracking-[0.16em] uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-4 text-base leading-relaxed sm:text-lg">
            {description}
          </p>
        )}
      </div>
      {children && <div className="mt-10 sm:mt-14">{children}</div>}
    </section>
  );
}
