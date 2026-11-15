import { Check } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  /** Compact variant for dense multi-select grids (interests, skills). */
  compact?: boolean;
}

/**
 * A selectable card built on a native <input>, so keyboard navigation (arrow keys in radio
 * groups, Space on checkboxes), focus and screen-reader semantics are provided by the browser.
 * The input is visually hidden; the card reflects its state through `has-[:checked]` styling.
 */
export function OptionCard({
  type,
  name,
  value,
  checked,
  onChange,
  title,
  hint,
  disabled,
  compact,
}: OptionCardProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <label
      htmlFor={id}
      className={cn(
        "group bg-card relative flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-border text-left transition-all duration-200",
        "hover:border-primary/40 hover:shadow-soft",
        "has-[:checked]:border-primary has-[:checked]:bg-accent",
        "has-[:focus-visible]:ring-ring/40 has-[:focus-visible]:ring-4",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45 has-[:disabled]:hover:border-border has-[:disabled]:hover:shadow-none",
        compact ? "p-3.5" : "p-4 sm:p-5",
      )}
    >
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        aria-describedby={hint ? hintId : undefined}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center border-2 border-input bg-white text-transparent transition-colors",
          type === "radio" ? "rounded-full" : "rounded-md",
          "group-has-[:checked]:border-primary group-has-[:checked]:bg-primary group-has-[:checked]:text-white",
        )}
      >
        <Check className="size-3.5" strokeWidth={3.5} />
      </span>
      <span className="min-w-0">
        <span className={cn("block leading-snug font-bold", compact ? "text-[0.95rem]" : "text-base")}>
          {title}
        </span>
        {hint && (
          <span id={hintId} className="text-muted-foreground mt-0.5 block text-sm leading-snug">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}
