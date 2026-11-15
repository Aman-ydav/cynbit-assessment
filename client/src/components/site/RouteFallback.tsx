import { Loader2 } from "lucide-react";

export function RouteFallback() {
  return (
    <div role="status" className="flex min-h-[50svh] items-center justify-center">
      <Loader2 className="text-primary size-7 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
