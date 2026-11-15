import type { ReadinessBand } from "@bitelevate/shared";
import { cn } from "@/lib/utils";

const BAND_COLOR: Record<ReadinessBand, string> = {
  ready: "#1b6e46",
  short_prep: "#8a5a00",
  prep_first: "#a23b1d",
};

interface ReadinessRingProps {
  score: number;
  band: ReadinessBand;
  size?: number;
  className?: string;
}

/** Circular gauge for the 0–100 readiness score. The number is always shown in text too. */
export function ReadinessRing({ score, band, size = 72, className }: ReadinessRingProps) {
  const radius = 15.9155; // circumference ≈ 100, so the dash length equals the percentage
  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Readiness ${score} out of 100`}
    >
      <svg viewBox="0 0 36 36" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r={radius} fill="none" stroke="#e1ebec" strokeWidth="3.4" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={BAND_COLOR[band]}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeDasharray={`${score} 100`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <span
        className="font-heading absolute text-[0.95rem] leading-none font-extrabold"
        style={{ color: BAND_COLOR[band] }}
        aria-hidden="true"
      >
        {score}
        <span className="text-[0.6rem] font-bold">%</span>
      </span>
    </div>
  );
}
