import { Eye, Hand, ScrollText } from "lucide-react";

const PROMISES = [
  {
    icon: Hand,
    title: "No sign-up wall",
    body: "You see your plan first. We only ask for an email afterwards — and only if you want a follow-up.",
  },
  {
    icon: Eye,
    title: "Rules, not a black box",
    body: "Interests 50%, goal 20%, level 20%, skills 10%. Every reason is shown, and the same answers always give the same plan.",
  },
  {
    icon: ScrollText,
    title: "Guidance, not a guarantee",
    body: "Plans follow the public BitElevate curriculum. Cynbit's mentors have the final word on lab content and prerequisites.",
  },
] as const;

export function HonestBand() {
  return (
    <section className="bg-brand-ink text-white" aria-labelledby="honest-heading">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-brand-glow font-heading mb-3 text-xs font-bold tracking-[0.16em] uppercase">
          Honest by design
        </p>
        <h2 id="honest-heading" className="max-w-2xl text-3xl font-extrabold sm:text-4xl">
          A recommendation you can trust enough to question
        </h2>

        <ul className="mt-12 grid gap-8 md:grid-cols-3">
          {PROMISES.map((promise) => (
            <li key={promise.title} className="flex gap-4">
              <span className="text-brand-glow grid size-11 shrink-0 place-items-center rounded-xl bg-white/10">
                <promise.icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold">{promise.title}</h3>
                <p className="mt-2 leading-relaxed text-white/75">{promise.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
