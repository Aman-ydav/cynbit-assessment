import { LAB_LIST, LEVEL_LABEL } from "@bitelevate/shared";
import { Section } from "@/components/site/Section";
import { Badge } from "@/components/ui/badge";
import { LAB_ICON, LAB_TINT } from "@/lib/lab-visuals";
import { cn } from "@/lib/utils";

export function LabsGrid() {
  return (
    <div className="bg-muted/60 border-y">
      <Section
        id="labs"
        eyebrow="The six labs"
        title="Six real projects. One is the right fit for you."
        description="Each BitElevate lab is a production-style repository with daily pull-request reviews. Here is what each one is really about — and who it suits."
      >
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {LAB_LIST.map((lab) => {
            const Icon = LAB_ICON[lab.id];
            return (
              <li
                key={lab.id}
                className="bg-card shadow-soft group flex flex-col rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn("grid size-12 place-items-center rounded-2xl", LAB_TINT[lab.id])}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <Badge variant="outline" className="font-semibold">
                    {LEVEL_LABEL[lab.level]}
                  </Badge>
                </div>

                <p className="text-muted-foreground font-heading mt-5 text-xs font-bold tracking-[0.14em] uppercase">
                  {lab.project}
                </p>
                <h3 className="mt-1 text-xl font-extrabold">{lab.name}</h3>
                <p className="text-muted-foreground mt-2 text-[0.95rem] leading-relaxed">
                  {lab.tagline}.
                </p>

                <ul className="mt-4 mb-5 flex flex-wrap gap-1.5" aria-label={`${lab.name} stack`}>
                  {lab.stack.slice(0, 5).map((item) => (
                    <li
                      key={item}
                      className="bg-muted text-foreground/80 rounded-full px-2.5 py-1 text-xs font-semibold"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <p className="mt-auto border-t pt-4 text-sm leading-relaxed">
                  <span className="text-primary font-bold">Choose it if </span>
                  <span className="text-muted-foreground">
                    {lab.chooseIf.charAt(0).toLowerCase() + lab.chooseIf.slice(1)}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}
