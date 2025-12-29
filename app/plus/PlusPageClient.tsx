"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PricingCards } from "./PricingCards";

export function PlusPageClient() {
  const t = useTranslations("plus");

  return (
    <main className="min-h-screen bg-[#1b57cf] p-6 sm:p-10">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white font-bold text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </Link>

        <h1 className="text-white font-bold text-2xl sm:text-3xl mb-3">
          {t("title")}
        </h1>
        <p className="text-white/70 text-base mb-8">
          {t("description")}
        </p>

        {/* Supported Cities */}
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/40 rounded-xl">
          <p className="text-green-200 text-sm">
            <strong>{t("supportedCities")}:</strong> {t("supportedCitiesList")}
          </p>
          <p className="text-green-200/70 text-xs mt-2">
            {t("otherCitiesNote")}
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingCards />

        {/* Terms of Service - kept in Finnish as it's a legal document */}
        <section className="mb-8 pt-8 border-t border-white/20">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-4">
            {t("termsOfService")}
          </h2>

          <div className="space-y-6 text-white/80 text-sm">
            <div>
              <h3 className="text-white font-semibold mb-2">1. Palvelun kuvaus</h3>
              <p>
                SeuraavaBussi Plus on maksullinen lisäpalvelu, joka tarjoaa pääsyn
                reaaliaikaiseen bussien sijaintitietoon kartalla. Palvelu on tarkoitettu
                henkilökohtaiseen, ei-kaupalliseen käyttöön.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">2. Kolmansien osapuolten tietolähteet</h3>
              <p>
                SeuraavaBussi Plus -palvelu käyttää kolmansien osapuolten tarjoamia
                avoimia rajapintoja (API), mukaan lukien Digitransit, ITS Factory,
                HSL ja Waltti. <strong>Emme omista, hallinnoi tai vastaa näiden
                rajapintojen toiminnasta, saatavuudesta tai tietojen oikeellisuudesta.</strong>
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">3. Vastuunrajoitus</h3>
              <p className="mb-2">
                Palvelu tarjotaan &ldquo;sellaisena kuin se on&rdquo; ilman takuita.
                TutorSwap Oy ei vastaa:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Sijaintitietojen oikeellisuudesta tai ajantasaisuudesta</li>
                <li>Kolmansien osapuolten rajapintojen toimintahäiriöistä tai muutoksista</li>
                <li>Palvelun keskeytyksistä tai käyttökatkoista</li>
                <li>Vahingoista, jotka aiheutuvat palvelun käytöstä tai käytön estymisestä</li>
                <li>Myöhästymisistä tai muista seuraamuksista, jotka johtuvat sijaintitietoihin luottamisesta</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">4. Tietojen tarkkuus</h3>
              <p>
                Bussien sijaintitiedot ovat arvioita, jotka perustuvat kolmansien osapuolten
                tarjoamaan dataan. Tiedot voivat olla epätarkkoja, viivästyneitä tai puutteellisia.
                Käyttäjän tulee aina tarkistaa viralliset aikataulut ja varautua muutoksiin.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">5. Palvelun saatavuus</h3>
              <p>
                Emme takaa palvelun keskeytyksetöntä toimintaa. Kolmansien osapuolten
                rajapintojen muutokset voivat vaikuttaa palvelun toimintaan tai johtaa
                ominaisuuksien poistamiseen. Tällaisissa tapauksissa emme ole velvollisia
                palauttamaan maksuja.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">6. Maksut ja peruutukset</h3>
              <p className="mb-2">
                <strong>Kuukausitilaus (3€/kk):</strong> Veloitetaan kuukausittain.
                Voit peruuttaa tilauksen milloin tahansa, jolloin tilaus päättyy
                kuluvan laskutuskauden lopussa. Kuukausimaksuja ei palauteta.
              </p>
              <p>
                <strong>Kertamaksu (30€):</strong> Kertamaksu antaa käyttöoikeuden
                palveluun niin kauan kuin palvelu on toiminnassa. Jos et ole tyytyväinen,
                voit pyytää täyden hyvityksen 7 päivän sisällä ostosta lähettämällä
                sähköpostia osoitteeseen{" "}
                <a href="mailto:zhiyuan.liu023@gmail.com" className="underline hover:text-white">
                  zhiyuan.liu023@gmail.com
                </a>.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">7. Palvelun muutokset ja lopettaminen</h3>
              <p>
                Pidätämme oikeuden muuttaa, keskeyttää tai lopettaa palvelun tai sen
                ominaisuuksia milloin tahansa. Mikäli palvelu lopetetaan kokonaan,
                kuukausitilausten veloitus lopetetaan, mutta kertamaksuja ei palauteta.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">8. Alueellinen saatavuus</h3>
              <p>
                Reaaliaikainen sijaintitieto on saatavilla vain alueilla, joilla
                kolmannen osapuolen rajapinnat tarjoavat tätä tietoa. Tällä hetkellä
                tuetut kaupungit ovat Helsinki, Tampere, Turku, Oulu, Jyväskylä ja Lahti.
                Muissa kaupungeissa sijaintitieto ei ole vielä saatavilla.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">9. Sovellettava laki</h3>
              <p>
                Näihin ehtoihin sovelletaan Suomen lakia. Mahdolliset riidat ratkaistaan
                Pirkanmaan käräjäoikeudessa. Kuluttajalla on aina oikeus saattaa asia
                oman kotipaikkansa käräjäoikeuden tai kuluttajariitalautakunnan käsiteltäväksi.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">10. Yhteystiedot</h3>
              <div className="space-y-1">
                <p className="font-semibold">TutorSwap Oy</p>
                <p>Y-tunnus: 3552891-3</p>
                <p>Ritakatu 13, 33530 Tampere</p>
                <p>
                  Sähköposti:{" "}
                  <a
                    href="mailto:zhiyuan.liu023@gmail.com"
                    className="underline hover:text-white"
                  >
                    zhiyuan.liu023@gmail.com
                  </a>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">11. Ehtojen hyväksyminen</h3>
              <p>
                Ostamalla SeuraavaBussi Plus -tilauksen hyväksyt nämä käyttöehdot
                sekä palvelun tietosuojaselosteen.
              </p>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="mb-8 pt-4 border-t border-white/20">
          <div className="flex flex-col gap-2">
            <Link
              href="/tietosuoja"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              {t("privacyPolicy")} →
            </Link>
          </div>
        </section>

        <div className="pt-4 border-t border-white/20">
          <p className="text-white/40 text-xs mb-4">
            {t("updated")}: {new Date().toLocaleDateString("fi-FI")}
          </p>
          <Link
            href="/"
            className="text-white/70 hover:text-white font-bold text-sm transition-colors"
          >
            ← {t("backToHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
