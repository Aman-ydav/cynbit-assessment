import { ExternalLink } from "lucide-react";
import { Link } from "react-router";
import { Logo } from "@/components/site/Logo";
import { ENROL_URL } from "@/lib/config";

export function Footer() {
  return (
    <footer className="no-print bg-brand-ink text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="[&_a]:text-white [&_span]:text-white [&_span_span]:text-white/70">
            <Logo />
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/70">
            An instant, explainable 60-day plan for the BitElevate remote engineering internship —
            built around your level, goal and time.
          </p>
        </div>

        <nav aria-label="Footer" className="space-y-3 text-sm">
          <p className="font-heading text-xs font-bold tracking-[0.16em] text-white/50 uppercase">
            Explore
          </p>
          <ul className="space-y-2">
            <li>
              <Link className="hover:text-white" to="/path">
                Build my plan
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" to="/#labs">
                The six labs
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" to="/#faq">
                FAQ
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" to="/privacy">
                Privacy
              </Link>
            </li>
          </ul>
        </nav>

        <div className="space-y-3 text-sm">
          <p className="font-heading text-xs font-bold tracking-[0.16em] text-white/50 uppercase">
            Official program
          </p>
          <a
            href={ENROL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-white"
          >
            BitElevate on cynbit.in <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed text-white/60 sm:px-6">
          Prototype built for Cynbit Technologies&rsquo; Full Stack Developer Intern assessment. It
          is not an official Cynbit product. Program details (duration, price, phases) are taken
          from the public BitElevate page as listed on 15 Nov 2026; plans are guidance, not a
          guarantee.
        </p>
      </div>
    </footer>
  );
}
