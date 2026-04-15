export const dynamic = "force-dynamic";

import { Hero } from "@/components/landing/hero";
import { Benefits } from "@/components/landing/benefits";
import { Pricing } from "@/components/landing/pricing";
import { EventsPreview } from "@/components/landing/events-preview";
import { NewsPreview } from "@/components/landing/news-preview";
import { Testimonials } from "@/components/landing/testimonials";
import { CtaFinal } from "@/components/landing/cta-final";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Benefits />
      <Pricing />
      <EventsPreview />
      <NewsPreview />
      <Testimonials />
      <CtaFinal />
    </>
  );
}
