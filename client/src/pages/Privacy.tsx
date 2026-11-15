import type { ReactNode } from "react";
import { Link } from "react-router";
import { usePageTitle } from "@/hooks/usePageTitle";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold sm:text-2xl">{title}</h2>
      <div className="text-muted-foreground mt-3 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

/** Plain-language description of what this prototype actually collects and why. */
export default function Privacy() {
  usePageTitle("Privacy");
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-primary font-heading text-xs font-bold tracking-[0.16em] uppercase">
        Privacy notice
      </p>
      <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">What we collect, and what we don&rsquo;t</h1>
      <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
        This is a prototype built for Cynbit Technologies&rsquo; Full Stack Developer Intern
        assessment. This page describes exactly what the prototype does with your information.
      </p>

      <Block title="Building a plan needs no personal data">
        <p>
          Your answers (year, experience, goal, interests, time, skills) are used to build your plan.
          They are not linked to your name, email or device. The share link for your plan contains
          only those answers, packed into a short code — nothing that identifies you.
        </p>
        <p>
          For product analytics we keep an <strong className="text-foreground">anonymous copy of the
          answers</strong> (for example, which labs get recommended and which interests no lab covers)
          for up to a year.
        </p>
      </Block>

      <Block title="Anonymous usage events">
        <p>
          While you use the tool, it records simple events such as &ldquo;finished step 2&rdquo; or
          &ldquo;opened the enrol link&rdquo;, tagged with a random id that exists only in your
          browser tab (<code>sessionStorage</code>). It is not a cookie, is not shared across sites
          and disappears when you close the tab. These events are deleted automatically after 180 days.
        </p>
        <p>
          If your browser sends <strong className="text-foreground">Do Not Track</strong>, no events
          are sent at all. If the site owner has configured Google Analytics 4, page views and the
          same events are also sent to Google with IP anonymisation turned on.
        </p>
      </Block>

      <Block title="If you ask to be contacted">
        <p>
          After you have seen your plan you may choose to share your name, email and (optionally)
          phone or WhatsApp number. We only do this with your explicit consent, and store:
        </p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>the details you typed, and which lab your plan recommended;</li>
          <li>the time you gave consent;</li>
          <li>whether we emailed your plan link to you.</li>
        </ul>
        <p>
          We never ask for your date of birth, gender or home address. Your details are used only so
          that Cynbit&rsquo;s team can follow up about BitElevate.
        </p>
      </Block>

      <Block title="Deleting your details">
        <p>
          Right after you submit the form you will see a <strong className="text-foreground">Delete my
          details</strong> button. It removes your record immediately. You can withdraw your consent
          at any time; if you no longer have that button, ask the site owner to delete your record by
          email address.
        </p>
      </Block>

      <Block title="Safeguards">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Traffic is encrypted in transit (HTTPS) when deployed.</li>
          <li>Forms are protected against automated spam and are rate-limited.</li>
          <li>The admin dashboard is password-protected and is not indexed by search engines.</li>
        </ul>
      </Block>

      <p className="mt-12">
        <Link to="/path" className="text-primary font-bold underline underline-offset-4">
          Back to building my plan
        </Link>
      </p>
    </article>
  );
}
