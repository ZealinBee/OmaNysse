"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

const regions = [
  { href: "/helsinki", name: "Helsinki (HSL)", color: "#007AC9" },
  { href: "/tampere", name: "Tampere (Nysse)", color: "#1b57cf" },
  { href: "/turku", name: "Turku (Föli)", color: "#00A19C" },
  { href: "/oulu", name: "Oulu (OSL)", color: "#E30A69" },
  { href: "/jyvaskyla", name: "Jyväskylä (Linkki)", color: "#109D2C" },
  { href: "/lahti", name: "Lahti (LSL)", color: "#1570B8" },
  { href: "/kuopio", name: "Kuopio (Vilkku)", color: "#554096" },
  { href: "/lappeenranta", name: "Lappeenranta (Jouko)", color: "#DD3189" },
  { href: "/hameenlinna", name: "Hämeenlinna", color: "#C3291E" },
  { href: "/pori", name: "Pori", color: "#00ADEF" },
];

const popularStops = [
  { href: "/helsinki/rautatientori", name: "Rautatientori, Helsinki" },
  { href: "/tampere/keskustori", name: "Keskustori, Tampere" },
  { href: "/turku/kauppatori", name: "Kauppatori, Turku" },
  { href: "/oulu/keskusta", name: "Keskusta, Oulu" },
  { href: "/jyvaskyla/matkakeskus", name: "Matkakeskus, Jyväskylä" },
  { href: "/lahti/matkakeskus", name: "Matkakeskus, Lahti" },
  { href: "/kuopio/keskusta", name: "Keskusta, Kuopio" },
  { href: "/lappeenranta/keskusta", name: "Keskusta, Lappeenranta" },
  { href: "/hameenlinna/keskusta", name: "Keskusta, Hämeenlinna" },
  { href: "/pori/keskusta", name: "Keskusta, Pori" },
];

export function FooterContent() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-16 pt-8 border-t border-white/20">
      <div className="text-white/70 text-sm space-y-8">
        {/* Service Description */}
        <section>
          <h2 className="text-white font-bold text-lg mb-3">
            {t("aboutTitle")}
          </h2>
          <p className="leading-relaxed">{t("aboutText")}</p>
        </section>

        {/* Supported Regions */}
        <section>
          <h3 className="text-white font-bold text-base mb-3">
            {t("supportedRegions")}
          </h3>
          <ul className="grid grid-cols-2 gap-2">
            {regions.map((region) => (
              <li key={region.href} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: region.color }}
                />
                <a
                  href={region.href}
                  className="hover:text-white transition-colors"
                >
                  {region.name}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section>
          <h3 className="text-white font-bold text-base mb-3">
            {t("faqTitle")}
          </h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-white/90 font-semibold">
                {t("faq1Question")}
              </dt>
              <dd className="mt-1 text-white/60">{t("faq1Answer")}</dd>
            </div>
            <div>
              <dt className="text-white/90 font-semibold">
                {t("faq2Question")}
              </dt>
              <dd className="mt-1 text-white/60">{t("faq2Answer")}</dd>
            </div>
            <div>
              <dt className="text-white/90 font-semibold">
                {t("faq3Question")}
              </dt>
              <dd className="mt-1 text-white/60">{t("faq3Answer")}</dd>
            </div>
            <div>
              <dt className="text-white/90 font-semibold">
                {t("faq4Question")}
              </dt>
              <dd className="mt-1 text-white/60">{t("faq4Answer")}</dd>
            </div>
          </dl>
        </section>

        {/* Top Stops */}
        <section>
          <h3 className="text-white font-bold text-base mb-3">
            {t("popularStops")}
          </h3>
          <ul className="grid grid-cols-2 gap-2">
            {popularStops.map((stop) => (
              <li key={stop.href}>
                <a
                  href={stop.href}
                  className="hover:text-white transition-colors"
                >
                  {stop.name}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Data Sources */}
        <section className="pt-4 border-t border-white/10">
          <p className="text-white/50 text-xs">
            {t("dataSourcesLabel")}{" "}
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
              href="https://www.hsl.fi"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/70"
            >
              HSL
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
            <Link href="/tietosuoja" className="underline hover:text-white/70">
              {t("privacyPolicy")}
            </Link>
          </p>
        </section>
      </div>
    </footer>
  );
}
