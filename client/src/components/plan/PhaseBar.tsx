import { PHASES } from "@bitelevate/shared";
import { cn } from "@/lib/utils";

const SEGMENT_COLORS = ["#7ad5dd", "#3fb8c2", "#007b83", "#006067", "#0b3f43"];
const SHORT_NAMES = ["Setup", "Tests", "Core build", "Speed", "Capstone"];

/** The 60 days as one proportional bar, one segment per phase. */
export function PhaseBar({ className, showLabels = true }: { className?: string; showLabels?: boolean }) {
  const total = PHASES.reduce((sum, p) => sum + (p.days[1] - p.days[0] + 1), 0);
  const summary = PHASES.map((p) => `${p.title}, days ${p.days[0]} to ${p.days[1]}`).join("; ");

  return (
    <div className={className} role="img" aria-label={`60-day roadmap: ${summary}`}>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {PHASES.map((phase, index) => (
          <span
            key={phase.id}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${((phase.days[1] - phase.days[0] + 1) / total) * 100}%`,
              backgroundColor: SEGMENT_COLORS[index],
            }}
          />
        ))}
      </div>
      {showLabels && (
        <div className="mt-2 flex gap-0.5" aria-hidden="true">
          {PHASES.map((phase, index) => (
            <span
              key={phase.id}
              className={cn(
                "text-muted-foreground truncate text-xs font-semibold",
                index % 2 === 1 && "hidden sm:block",
              )}
              style={{ width: `${((phase.days[1] - phase.days[0] + 1) / total) * 100}%` }}
            >
              {SHORT_NAMES[index]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
