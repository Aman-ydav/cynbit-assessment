import { Section } from "@/components/site/Section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is it free?",
    a: "Yes. Building and viewing your plan is free and needs no account. Enrolling in BitElevate is separate and happens on cynbit.in.",
  },
  {
    q: "How does it decide which lab fits me?",
    a: "With transparent rules, not a black box. It weighs your interests (50%), goal (20%), experience level (20%) and skills (10%) against each lab, then shows you the reasons. The same answers always produce the same plan.",
  },
  {
    q: "How accurate is it?",
    a: "It is guidance based on the public BitElevate curriculum — a strong starting point, not a guarantee. Cynbit's mentors have the final word on lab content and prerequisites.",
  },
  {
    q: "What if I'm interested in something no lab covers?",
    a: "We'll say so. Topics like blockchain or IoT don't have a BitElevate lab yet, so we recommend the closest fit and note your interest — which helps Cynbit decide what to build next.",
  },
  {
    q: "Do I have to share my email?",
    a: "No. You can view, share and print your plan without it. If you'd like a follow-up, we ask for your details after you've seen your plan, with your consent — and you can delete them whenever you like.",
  },
  {
    q: "I'm a complete beginner. Is that okay?",
    a: "Yes. Your plan includes a prep sprint for any core skill you're missing, with realistic hours. If your best interest match is a big stretch, we'll tell you and suggest a gentler start.",
  },
] as const;

export function Faq() {
  return (
    <Section
      id="faq"
      eyebrow="FAQ"
      title="Questions, answered plainly"
      description="Can't find yours? The plan page has an option to talk to an advisor."
      align="center"
    >
      <Accordion type="single" collapsible className="mx-auto max-w-3xl">
        {FAQS.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger className="font-heading text-left text-base font-bold sm:text-lg">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base leading-relaxed">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}
