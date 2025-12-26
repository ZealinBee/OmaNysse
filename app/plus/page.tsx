import { ArrowLeft, Map, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { PricingCards } from "./PricingCards";

export const metadata: Metadata = {
  title: "SeuraavaBussi Plus | SeuraavaBussi.fi",
  description:
    "Hanki SeuraavaBussi Plus ja näe bussien sijainnit kartalla reaaliajassa. 3€/kk tai 30€ kertamaksulla.",
  openGraph: {
    title: "SeuraavaBussi Plus | SeuraavaBussi.fi",
    description:
      "Hanki SeuraavaBussi Plus ja näe bussien sijainnit kartalla reaaliajassa. 3€/kk tai 30€ kertamaksulla.",
    url: "https://seuraavabussi.fi/plus",
    siteName: "SeuraavaBussi.fi",
    locale: "fi_FI",
    type: "website",
  },
};

export default function PlusPage() {
  return (
    <main className="min-h-screen bg-[#1b57cf] p-6 sm:p-10">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white font-bold text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Takaisin
        </Link>

        <h1 className="text-white font-bold text-2xl sm:text-3xl mb-3">
          SeuraavaBussi Plus
        </h1>
        <p className="text-white/70 text-base mb-8">
          Näe bussien ja ratikoiden sijainnit kartalla reaaliajassa
        </p>

        {/* HSL Notice */}
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-xl">
          <p className="text-yellow-200 text-sm">
            <strong>Huom:</strong> Reaaliaikainen karttaominaisuus ei toimi HSL-alueella (Helsinki, Espoo, Vantaa) teknisistä rajoituksista johtuen. Kartta toimii Waltti-alueilla (Tampere, Turku, Oulu jne.).
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingCards />

        {/* Terms of Service */}
        <section className="mb-8 pt-8 border-t border-white/20">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-4">
            Käyttöehdot
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
                kuluvan laskutuskauden lopussa. Peruutuksen jälkeen maksuja ei palauteta
                kuluvan kauden osalta.
              </p>
              <p>
                <strong>Kertamaksu (30€):</strong> Kertamaksu on lopullinen eikä palautettavissa,
                ellei pakottava lainsäädäntö toisin edellytä. Kertamaksu antaa käyttöoikeuden
                palveluun niin kauan kuin palvelu on toiminnassa.
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
                tuetut alueet ovat Waltti-alueet (mm. Tampere, Turku, Oulu). HSL-alueella
                (Helsinki) reaaliaikainen sijaintitieto ei ole saatavilla teknisistä syistä.
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
                    href="mailto:meeting@tutorswap.app"
                    className="underline hover:text-white"
                  >
                    meeting@tutorswap.app
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
              Tietosuojaseloste →
            </Link>
          </div>
        </section>

        <div className="pt-4 border-t border-white/20">
          <p className="text-white/40 text-xs mb-4">
            Päivitetty: {new Date().toLocaleDateString("fi-FI")}
          </p>
          <Link
            href="/"
            className="text-white/70 hover:text-white font-bold text-sm transition-colors"
          >
            ← Takaisin etusivulle
          </Link>
        </div>
      </div>
    </main>
  );
}
