"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CityConfig } from "@/app/lib/cities";
import { REGION_COLORS } from "@/app/lib/types";
import DepartureBoard from "@/app/components/DepartureBoard";
import AddToHomeScreenPrompt from "@/app/components/AddToHomeScreenPrompt";

interface CityPageClientProps {
  city: CityConfig;
}

export default function CityPageClient({ city }: CityPageClientProps) {
  const router = useRouter();
  const [themeColor, setThemeColor] = useState(city.color || REGION_COLORS.default);

  const handleThemeColorChange = useCallback((color: string) => {
    setThemeColor(color);
  }, []);

  const handleRequestUserLocation = useCallback(() => {
    // Redirect to main page where GPS location will be requested
    router.push("/");
  }, [router]);

  return (
    <main
      className="min-h-screen p-6 sm:p-10 transition-colors duration-500 relative"
      style={{ backgroundColor: themeColor }}
    >
      <div className="max-w-2xl mx-auto pt-6">
        {/* Logo */}
        <div className="absolute top-[11px] left-3 sm:top-[23px] sm:left-6 flex items-center gap-2">
          <a href="/" className="flex items-center gap-2">
            <img
              src="/white%20logo%20bus.png"
              alt="SeuraavaBussi logo"
              className="h-6 sm:h-8"
            />
            <span className="text-white font-bold text-lg sm:text-xl">
              SeuraavaBussi.fi
            </span>
          </a>
        </div>

        {/* City-specific SEO Header */}
        <header className="mb-8 pt-4">
          <h1 className="text-white font-bold text-2xl sm:text-3xl mb-3">
            Bussit {city.name}
            {city.name.endsWith("a") || city.name.endsWith("ä")
              ? "ssa"
              : city.name.endsWith("i")
              ? "ssä"
              : "ssa"}
          </h1>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed">
            {city.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {city.features.map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium"
              >
                {feature}
              </span>
            ))}
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs">
              {city.operator}
            </span>
          </div>
        </header>

        {/* Departure Board */}
        <DepartureBoard
          onThemeColorChange={handleThemeColorChange}
          initialCoords={city.coords}
          initialLocationName={city.locationName}
          onRequestUserLocation={handleRequestUserLocation}
        />

        {/* City-specific SEO Footer */}
        <footer className="mt-16 pt-8 border-t border-white/20">
          <div className="text-white/70 text-sm space-y-6">
            <section>
              <h2 className="text-white font-bold text-lg mb-2">
                {city.operatorName} ({city.operator})
              </h2>
              <p className="text-white/60 text-sm">
                Näytämme {city.operator}-alueen reaaliaikaiset lähtöajat suoraan
                puhelimeesi. Tiedot päivittyvät automaattisesti ja näet aina
                seuraavat lähdöt lähimmiltä pysäkeiltä.
              </p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-2">
                Muut kaupungit
              </h3>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/"
                  className="text-white/60 hover:text-white underline text-sm"
                >
                  Kaikki alueet
                </a>
                {["helsinki", "tampere", "turku", "oulu", "jyvaskyla"]
                  .filter((slug) => slug !== city.slug)
                  .map((slug) => (
                    <a
                      key={slug}
                      href={`/${slug}`}
                      className="text-white/60 hover:text-white underline text-sm capitalize"
                    >
                      {slug === "jyvaskyla" ? "Jyväskylä" : slug.charAt(0).toUpperCase() + slug.slice(1)}
                    </a>
                  ))}
              </div>
            </section>

            <section className="pt-4 border-t border-white/10">
              <p className="text-white/50 text-xs">
                Lähtöaikatiedot:{" "}
                <a
                  href="https://digitransit.fi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white/70"
                >
                  Digitransit
                </a>
                {" / "}
                <a
                  href="https://waltti.fi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white/70"
                >
                  Waltti
                </a>
              </p>
              <p className="text-white/50 text-xs mt-2">
                © {new Date().getFullYear()} SeuraavaBussi.fi
                {" · "}
                <a
                  href="/tietosuoja"
                  className="underline hover:text-white/70"
                >
                  Tietosuojaseloste
                </a>
              </p>
            </section>
          </div>
        </footer>
      </div>

      {/* Add to Home Screen prompt */}
      <AddToHomeScreenPrompt />
    </main>
  );
}
