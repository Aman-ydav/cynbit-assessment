import { usePageTitle } from "@/hooks/usePageTitle";

// Placeholder — the plan view lands in its own commit.
export default function Plan() {
  usePageTitle("Your plan");
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold">Your plan</h1>
    </section>
  );
}
