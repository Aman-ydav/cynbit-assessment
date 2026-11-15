import { usePageTitle } from "@/hooks/usePageTitle";

// Placeholder — the privacy notice lands with the lead-capture commit.
export default function Privacy() {
  usePageTitle("Privacy");
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold">Privacy</h1>
    </section>
  );
}
