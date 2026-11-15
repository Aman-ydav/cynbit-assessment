import { Link } from "react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-9 shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="9" fill="#006067" />
      <path
        d="M9 22.5c0-5.2 4.2-4.1 7.2-7.1 2.4-2.4 1.9-5.4 6.8-5.4"
        fill="none"
        stroke="#fff"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <circle cx="9" cy="22.5" r="2.5" fill="#96f1fa" />
      <circle cx="23" cy="10" r="2.5" fill="#fff" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      // No aria-label: the visible text ("Path Generator for BitElevate") is the accessible name,
      // which satisfies WCAG 2.5.3 (Label in Name) by construction.
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className="leading-none">
        <span className="font-heading block text-[17px] font-extrabold tracking-tight">
          Path Generator
        </span>
        <span className="text-muted-foreground mt-1 block text-xs font-semibold tracking-wide">
          for BitElevate
        </span>
      </span>
    </Link>
  );
}
