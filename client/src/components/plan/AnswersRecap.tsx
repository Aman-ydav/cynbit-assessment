import {
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  HOURS_OPTIONS,
  INTERESTS,
  SKILLS,
  STAGE_OPTIONS,
  type Plan,
} from "@bitelevate/shared";
import { Pencil } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { seedSaved } from "@/components/wizard/useWizard";

const labelOf = <T extends string>(options: readonly { value: T; label: string }[], value: T) =>
  options.find((option) => option.value === value)?.label ?? value;

/** What the plan is based on, with a one-click way back to adjust it. */
export function AnswersRecap({ plan }: { plan: Plan }) {
  const navigate = useNavigate();
  const { answers } = plan;

  const rows: [string, string][] = [
    ["You", `${labelOf(STAGE_OPTIONS, answers.stage)} · ${labelOf(EXPERIENCE_OPTIONS, answers.experience)}`],
    ["Goal", labelOf(GOAL_OPTIONS, answers.goal)],
    [
      "Interests",
      answers.interests.length > 0
        ? answers.interests.map((id) => INTERESTS[id].label).join(", ")
        : "Not sure yet",
    ],
    [
      "Time",
      `${labelOf(HOURS_OPTIONS, answers.hoursPerDay)} a day · ${answers.examsSoon ? "exams coming up" : "no exams soon"}`,
    ],
    [
      "Skills",
      answers.skills.length > 0 ? answers.skills.map((id) => SKILLS[id].label).join(", ") : "None yet",
    ],
  ];

  return (
    <section
      aria-labelledby="recap-title"
      className="bg-card shadow-soft no-print hidden w-80 shrink-0 rounded-3xl border p-5 lg:block"
    >
      <h2 id="recap-title" className="font-heading text-sm font-bold tracking-wide uppercase">
        Based on your answers
      </h2>
      <dl className="mt-4 space-y-2.5 text-sm">
        {rows.map(([term, value]) => (
          <div key={term}>
            <dt className="text-muted-foreground text-xs font-semibold">{term}</dt>
            <dd className="mt-0.5 leading-snug font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full"
        onClick={() => {
          seedSaved(answers);
          navigate("/path");
        }}
      >
        <Pencil /> Edit my answers
      </Button>
    </section>
  );
}
