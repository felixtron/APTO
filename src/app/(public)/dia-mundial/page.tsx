export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DIA_MUNDIAL, getEventWindowStatus } from "@/lib/dia-mundial";
import { SITE_URL } from "@/lib/constants";
import { ParallaxHero } from "./_components/parallax-hero";
import { RecordingsGallery } from "./_components/recordings-gallery";
import { EventStatusNotice } from "./_components/event-status-notice";
import { EventCtas } from "./_components/event-ctas";
import { RegistrationSection } from "./_components/registration-section";
import { getCampaignAccess } from "@/lib/campaign-access";
import { AboutEvent } from "./_components/about-event";

const PAGE_DESCRIPTION = `${DIA_MUNDIAL.theme}. ${DIA_MUNDIAL.dateLabel} abrimos de forma gratuita la biblioteca de conferencias de APTO para celebrar el Día Mundial de la Terapia Ocupacional.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${DIA_MUNDIAL.title} ${DIA_MUNDIAL.year} | APTO`,
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: `${DIA_MUNDIAL.title} ${DIA_MUNDIAL.year}`,
    description: PAGE_DESCRIPTION,
    images: [{ url: DIA_MUNDIAL.heroImage }],
  },
};

export default async function DiaMundialPage() {
  const status = getEventWindowStatus(new Date());
  const { registered } = await getCampaignAccess(DIA_MUNDIAL.campaign);
  const showGallery = status === "open" && registered;
  const recordingCount =
    status === "open" && !registered
      ? await prisma.recording.count({ where: { active: true } })
      : 0;

  // Solo se exponen los campos públicos: sin eventTitle ni fechas para no mostrar años.
  const recordings =
    showGallery
      ? await prisma.recording.findMany({
          where: { active: true },
          select: {
            id: true,
            title: true,
            description: true,
            videoUrl: true,
            duration: true,
            topics: true,
          },
          orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
        })
      : [];

  return (
    <div className="bg-white">
      <ParallaxHero
        status={status}
        registered={registered}
        recordingCount={recordingCount}
      />
      <AboutEvent />
      {showGallery ? (
        <RecordingsGallery recordings={recordings} />
      ) : status === "closed" ? (
        <EventStatusNotice />
      ) : (
        <RegistrationSection status={status} registered={registered} />
      )}
      <EventCtas />
    </div>
  );
}
