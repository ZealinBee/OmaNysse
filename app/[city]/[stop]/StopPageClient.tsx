"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CityConfig } from "@/app/lib/cities";
import { StopConfig, getStopsByCity } from "@/app/lib/stops";
import { REGION_COLORS } from "@/app/lib/types";
import DepartureBoard from "@/app/components/DepartureBoard";
import AddToHomeScreenPrompt from "@/app/components/AddToHomeScreenPrompt";
import { MapPin, Building2, GraduationCap, Cross, ShoppingBag, Home } from "lucide-react";

interface StopPageClientProps {
  city: CityConfig;
  stop: StopConfig;
}

const TYPE_ICONS = {
  hub: MapPin,
  university: GraduationCap,
  hospital: Cross,
  shopping: ShoppingBag,
  residential: Home,
};

const TYPE_LABELS = {
  hub: "Liikenteen solmukohta",
  university: "Yliopisto",
  hospital: "Sairaala",
  shopping: "Kauppakeskus",
  residential: "Asuinalue",
};

export default function StopPageClient({ city, stop }: StopPageClientProps) {
  const router = useRouter();
  const [themeColor, setThemeColor] = useState(city.color || REGION_COLORS.default);

  const handleThemeColorChange = useCallback((color: string) => {
    setThemeColor(color);
  }, []);

  const handleRequestUserLocation = useCallback(() => {
    router.push("/");
  }, [router]);

  const TypeIcon = TYPE_ICONS[stop.type] || Building2;
  const otherStops = getStopsByCity(city.slug).filter((s) => s.slug !== stop.slug);

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

        {/* Breadcrumb */}
        <nav className="mb-4 pt-4">
          <ol className="flex items-center gap-2 text-white/60 text-sm">
            <li>
              <a href="/" className="hover:text-white transition-colors">
                Etusivu
              </a>
            </li>
            <li>/</li>
            <li>
              <a href={`/${city.slug}`} className="hover:text-white transition-colors">
                {city.name}
              </a>
            </li>
            <li>/</li>
            <li className="text-white">{stop.name}</li>
          </ol>
        </nav>

        {/* Stop-specific SEO Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <TypeIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/70 text-sm">{TYPE_LABELS[stop.type]}</span>
          </div>
          <h1 className="text-white font-bold text-2xl sm:text-3xl mb-3">
            {stop.name} - Bussit ja aikataulut
          </h1>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed">
            {stop.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
              {city.name}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs">
              {city.operator}
            </span>
          </div>
        </header>

        {/* Departure Board */}
        <DepartureBoard
          onThemeColorChange={handleThemeColorChange}
          initialCoords={stop.coords}
          initialLocationName={stop.name}
          onRequestUserLocation={handleRequestUserLocation}
        />

        {/* Other Stops in City */}
        <section className="mt-12 pt-8 border-t border-white/20">
          <h2 className="text-white font-bold text-lg mb-4">
            Muut pysäkit - {city.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {otherStops.slice(0, 9).map((s) => (
              <a
                key={s.slug}
                href={`/${city.slug}/${s.slug}`}
                className="text-white/70 hover:text-white text-sm py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors truncate"
              >
                {s.name}
              </a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-white/20">
          <div className="text-white/70 text-sm space-y-6">
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
                {["helsinki", "tampere", "turku", "oulu", "jyvaskyla", "lahti", "kuopio", "lappeenranta", "hameenlinna", "pori"]
                  .filter((slug) => slug !== city.slug)
                  .slice(0, 5)
                  .map((slug) => (
                    <a
                      key={slug}
                      href={`/${slug}`}
                      className="text-white/60 hover:text-white underline text-sm capitalize"
                    >
                      {slug === "jyvaskyla" ? "Jyväskylä" :
                       slug === "hameenlinna" ? "Hämeenlinna" :
                       slug.charAt(0).toUpperCase() + slug.slice(1)}
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
