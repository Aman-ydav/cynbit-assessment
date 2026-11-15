import { AboutPrototype } from "@/components/landing/AboutPrototype";
import { Faq } from "@/components/landing/Faq";
import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { HonestBand } from "@/components/landing/HonestBand";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LabsGrid } from "@/components/landing/LabsGrid";
import { StickyCta } from "@/components/landing/StickyCta";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Landing() {
  usePageTitle();
  return (
    <>
      <Hero />
      <HowItWorks />
      <LabsGrid />
      <Features />
      <HonestBand />
      <Faq />
      <AboutPrototype />
      <FinalCta />
      <StickyCta />
    </>
  );
}
