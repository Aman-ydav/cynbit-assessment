import { usePageTitle } from "@/hooks/usePageTitle";

// Placeholder — the guided wizard lands in its own commit.
export default function Wizard() {
  usePageTitle("Build your plan");
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold">Build your plan</h1>
    </section>
  );
}
