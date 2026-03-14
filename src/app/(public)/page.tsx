import { Hero } from "@/components/landing/hero";
import { Benefits } from "@/components/landing/benefits";
import { Pricing } from "@/components/landing/pricing";
import { EventsPreview } from "@/components/landing/events-preview";
import { NewsPreview } from "@/components/landing/news-preview";
import { Universities } from "@/components/landing/universities";
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
      <Universities />
      <Testimonials />
      <CtaFinal />
    </>
  );
}
