import { usePageTitle } from "@/hooks/usePageTitle";

// Placeholder — the full landing page lands in its own commit.
export default function Landing() {
  usePageTitle();
  return (
    <section className="hero-glow mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <h1 className="text-4xl font-extrabold sm:text-6xl">Your personalised 60-day plan</h1>
    </section>
  );
}
