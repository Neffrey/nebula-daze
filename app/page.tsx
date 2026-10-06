import Image from "next/image";
import Collection from "@/components/Collection";
import SiteHeader from "@/components/SiteHeader";

const heroImage =
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=2000&q=80";
const editorialImage =
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative h-[88vh] min-h-[560px] bg-ink">
          <Image
            src={heroImage}
            alt="Model in a white dress standing in tall grass"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/20" />
          <div className="absolute bottom-0 left-0 max-w-xl p-6 text-cream sm:p-12">
            <p className="text-[12px] tracking-[0.28em] uppercase">
              Autumn / Winter 26
            </p>
            <h1 className="font-display mt-3 text-5xl leading-[0.95] sm:text-7xl">
              Cut for the hour after dark
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-cream/85">
              Tailoring, silk, and outerwear from the evening collection.
            </p>
            <a
              href="#new"
              className="mt-8 inline-block border border-cream px-6 py-3 text-[12px] tracking-[0.22em] uppercase"
            >
              Shop new arrivals
            </a>
          </div>
        </section>

        <Collection />

        <section className="grid lg:grid-cols-2">
          <div className="relative min-h-[520px] bg-surface">
            <Image
              src={editorialImage}
              alt="Model in a yellow tailored jacket"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center bg-ink px-6 py-16 text-cream sm:px-16">
            <p className="text-[12px] tracking-[0.22em] uppercase">The house</p>
            <h2 className="font-display mt-4 text-5xl leading-none">
              Cloth, not costume.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-cream/80">
              Nebula Daze is cut in small runs. Shoulders sit clean, hems fall long,
              and color stays close to stone, ink, and ivory. The clothes are
              made to be worn past midnight and again the next morning.
            </p>
          </div>
        </section>
      </main>
      <footer className="border-t border-foreground/10 px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-3">
          <div>
            <p className="font-display text-2xl whitespace-nowrap tracking-[0.2em] sm:text-3xl sm:tracking-[0.28em]">NEBULA DAZE</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
              18 Mercer Street
              <br />
              New York
            </p>
          </div>
          <div className="text-sm leading-8">
            <p className="text-[12px] tracking-[0.18em] uppercase">Visit</p>
            <p>Shipping</p>
            <p>Returns</p>
            <p>Stores</p>
          </div>
          <div className="text-sm leading-8">
            <p className="text-[12px] tracking-[0.18em] uppercase">Client care</p>
            <p>hello@example.com</p>
            <p>Monday–Friday, 10–6 ET</p>
          </div>
        </div>
      </footer>
    </>
  );
}
