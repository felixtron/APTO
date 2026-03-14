import Image from "next/image";

interface LogoItem {
  name: string;
  src: string;
  width?: number;
}

interface LogoCarouselProps {
  title: string;
  subtitle?: string;
  logos: LogoItem[];
}

export function LogoCarousel({ title, subtitle, logos }: LogoCarouselProps) {
  // Duplicate logos for seamless infinite scroll
  const allLogos = [...logos, ...logos];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="relative mt-10 overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent" />

        <div className="flex animate-scroll items-center gap-16 px-8">
          {allLogos.map((logo, i) => (
            <Image
              key={`${logo.name}-${i}`}
              src={logo.src}
              alt={logo.name}
              width={logo.width ?? 140}
              height={56}
              className="h-14 w-auto shrink-0 object-contain opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
