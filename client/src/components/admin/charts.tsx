import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/*
 * Small, dependency-free charts.
 *
 * Conventions (single series → one brand hue, no legend box needed — the card title names it):
 *  - thin marks, 4px rounded data-end, anchored square to the baseline
 *  - recessive grid and axes; text always in text colours, never the series colour
 *  - every value is available as text (direct label, tooltip, or "View as table"), so meaning
 *    never depends on colour alone
 */

export interface Datum {
  key: string;
  label: string;
  value: number;
  /** Secondary text shown beside the value, e.g. "67% of starters". */
  detail?: string;
}

function Tooltip({ children, align = "left" }: { children: ReactNode; align?: "left" | "center" }) {
  return (
    <span
      role="tooltip"
      className={cn(
        "bg-brand-ink pointer-events-none absolute -top-9 z-10 hidden rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-lift",
        "group-hover:block group-focus-visible:block",
        align === "center" ? "left-1/2 -translate-x-1/2" : "left-0",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyChart({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground bg-muted rounded-2xl px-4 py-6 text-center text-sm">
      {children}
    </p>
  );
}

/** Horizontal bars with direct labels — for ranked categories and funnel stages. */
export function BarList({ data, empty }: { data: Datum[]; empty: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0 || data.every((d) => d.value === 0 && !d.detail)) {
    return <EmptyChart>{empty}</EmptyChart>;
  }

  return (
    <ul className="space-y-4">
      {data.map((d) => (
        <li
          key={d.key}
          tabIndex={0}
          aria-label={`${d.label}: ${d.value}${d.detail ? `, ${d.detail}` : ""}`}
          className="group relative rounded-lg outline-offset-4"
        >
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="font-semibold">{d.label}</span>
            <span className="text-muted-foreground tabular-nums">
              <strong className="text-foreground">{d.value.toLocaleString("en-IN")}</strong>
              {d.detail && <span className="ml-2">{d.detail}</span>}
            </span>
          </div>
          <div className="bg-muted mt-1.5 h-2.5 rounded-full">
            <div
              className="bg-primary h-full rounded-l-[2px] rounded-r-[4px]"
              style={{ width: `${d.value === 0 ? 0 : Math.max(2, (d.value / max) * 100)}%` }}
            />
          </div>
          <Tooltip>
            {d.label}: {d.value.toLocaleString("en-IN")}
            {d.detail ? ` · ${d.detail}` : ""}
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}

/** Round the axis maximum up to an even, readable number so the three gridlines read cleanly. */
function niceMax(value: number): number {
  if (value <= 2) return 2;
  const power = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 4, 6, 8, 10].map((m) => m * power).find((c) => c >= value) ?? value;
}

interface ColumnChartProps {
  data: Datum[];
  /** Describes the chart for assistive technology. */
  ariaLabel: string;
  /** Show every Nth x-axis label (keeps 14 dates from colliding on narrow screens). */
  labelEvery?: number;
  valueHeading: string;
  labelHeading: string;
  empty: string;
}

/** Vertical columns on a shared baseline, with a three-line recessive grid and a table fallback. */
export function ColumnChart({
  data,
  ariaLabel,
  labelEvery = 1,
  valueHeading,
  labelHeading,
  empty,
}: ColumnChartProps) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return <EmptyChart>{empty}</EmptyChart>;
  }

  const top = niceMax(Math.max(...data.map((d) => d.value)));
  const ticks = [top, top / 2, 0];
  const peak = Math.max(...data.map((d) => d.value));

  return (
    <figure>
      <div role="img" aria-label={ariaLabel} className="relative h-44 pl-9">
        {/* recessive grid */}
        {ticks.map((tick) => (
          <div
            key={tick}
            className="absolute right-0 left-0 flex items-center"
            style={{ bottom: `${(tick / top) * 100}%` }}
            aria-hidden="true"
          >
            <span className="text-muted-foreground w-7 pr-2 text-right text-xs tabular-nums">{tick}</span>
            <span className={cn("h-px flex-1", tick === 0 ? "bg-border" : "bg-border/50")} />
          </div>
        ))}

        <div className="absolute inset-y-0 right-0 left-9 flex items-end gap-1">
          {data.map((d, index) => {
            const showValue = d.value > 0 && (d.value === peak || index === data.length - 1);
            return (
              <div
                key={d.key}
                tabIndex={0}
                aria-label={`${d.label}: ${d.value}`}
                className="group relative flex h-full flex-1 items-end rounded-sm outline-offset-2"
              >
                <div
                  className="bg-primary w-full rounded-t-[4px]"
                  style={{
                    height: `${(d.value / top) * 100}%`,
                    minHeight: d.value > 0 ? 3 : 0,
                  }}
                />
                {showValue && (
                  <span
                    className="text-foreground absolute left-1/2 -translate-x-1/2 text-xs font-bold tabular-nums"
                    style={{ bottom: `calc(${(d.value / top) * 100}% + 4px)` }}
                    aria-hidden="true"
                  >
                    {d.value}
                  </span>
                )}
                <Tooltip align="center">
                  {d.label}: {d.value}
                </Tooltip>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-1 pl-9 text-xs" aria-hidden="true">
        {data.map((d, index) => (
          <span key={d.key} className="text-muted-foreground flex-1 text-center">
            {index % labelEvery === 0 ? d.label : ""}
          </span>
        ))}
      </div>

      <details className="mt-4 text-sm">
        <summary className="text-primary cursor-pointer font-semibold">View as table</summary>
        <Table className="mt-2">
          <TableHeader>
            <TableRow>
              <TableHead>{labelHeading}</TableHead>
              <TableHead className="text-right">{valueHeading}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.key}>
                <TableCell>{d.label}</TableCell>
                <TableCell className="text-right tabular-nums">{d.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </details>
    </figure>
  );
}
