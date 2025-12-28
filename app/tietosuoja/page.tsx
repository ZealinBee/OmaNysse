import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tietosuojaseloste | SeuraavaBussi.fi",
  description:
    "SeuraavaBussi.fi-palvelun tietosuojaseloste. Lue miten käsittelemme henkilötietojasi GDPR:n mukaisesti.",
  openGraph: {
    title: "Tietosuojaseloste | SeuraavaBussi.fi",
    description:
      "SeuraavaBussi.fi-palvelun tietosuojaseloste. Lue miten käsittelemme henkilötietojasi GDPR:n mukaisesti.",
    url: "https://seuraavabussi.fi/tietosuoja",
    siteName: "SeuraavaBussi.fi",
    locale: "fi_FI",
    type: "website",
  },
};

export default function PrivacyPolicy() {
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

        <h1 className="text-white font-bold text-2xl sm:text-3xl mb-6">
          Tietosuojaseloste
        </h1>

        <p className="text-white/60 text-sm mb-8">
          Päivitetty: {new Date().toLocaleDateString("fi-FI")}
        </p>

        {/* Rekisterinpitäjä */}
        <section className="mb-8">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-3">
            1. Rekisterinpitäjä
          </h2>
          <div className="text-white/80 text-base space-y-1">
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
        </section>

        {/* Kerättävät tiedot */}
        <section className="mb-8">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-3">
            2. Kerättävät tiedot
          </h2>
          <div className="text-white/80 text-base space-y-3">
            <p>
              SeuraavaBussi.fi kerää ainoastaan <strong>sijaintitietoja</strong>{" "}
              palvelun toiminnan mahdollistamiseksi. Sijaintitietoja käytetään
              lähimpien pysäkkien ja lähtöaikojen hakemiseen.
            </p>
            <p>
              <strong>Emme tallenna sijaintitietojasi palvelimillemme.</strong>{" "}
              Sijaintitieto käsitellään ainoastaan selaimessasi ja lähetetään
              suoraan joukkoliikenteen rajapintoihin lähtöaikojen hakemiseksi.
              Sijaintitieto tallennetaan vain paikallisesti selaimesi
              muistiin (localStorage), jotta palvelu muistaa sijaintisi
              seuraavalla käynnillä.
            </p>
          </div>
        </section>

        {/* Tietojen käyttötarkoitus */}
        <section className="mb-8">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-3">
            3. Tietojen käyttötarkoitus
          </h2>
          <div className="text-white/80 text-base space-y-2">
            <p>Sijaintitietojasi käytetään ainoastaan:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Lähimpien pysäkkien etsimiseen</li>
              <li>Reaaliaikaisten lähtöaikojen näyttämiseen</li>
              <li>Oikean joukkoliikennejärjestelmän (HSL, Nysse, Föli jne.) valitsemiseen</li>
            </ul>
          </div>
        </section>

        {/* Oikeusperuste */}
        <section className="mb-8">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-3">
            4. Käsittelyn oikeusperuste
          </h2>
          <div className="text-white/80 text-base space-y-3">
            <p>
              Henkilötietojen käsittely perustuu EU:n yleisen tietosuoja-asetuksen
              (GDPR) artiklan 6(1)(a) mukaiseen <strong>suostumukseen</strong>.
              Pyydämme sijaintilupaa selaimesi kautta, ja voit milloin tahansa
              evätä tai peruuttaa luvan selaimen asetuksista.
            </p>
          </div>
        </section>

        {/* Tietojen säilytys */}
        <section className="mb-8">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-3">
            5. Tietojen säilytys ja siirto
          </h2>
          <div className="text-white/80 text-base space-y-3">
            <p>
              <strong>Emme tallenna henkilötietojasi palvelimillemme.</strong>{" "}
              Kaikki tiedot käsitellään reaaliaikaisesti, eikä mitään tietoja
              säilytetä rekisterinpitäjän järjestelmissä.
            </p>
            <p>
              Sijaintitieto lähetetään kolmansien osapuolten rajapintoihin
              (Digitransit, HSL, Waltti) lähtöaikojen hakemiseksi. Nämä palvelut
              käsittelevät tietoja omien tietosuojakäytäntöjensä mukaisesti.
            </p>
            <p>
              Selaimesi localStorage-muistiin tallennettu sijainti säilyy, kunnes
              tyhjennät selaimen tiedot tai poistat sen manuaalisesti.
            </p>
          </div>
        </section>

        {/* Evästeet */}
        <section className="mb-8">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-3">
            6. Evästeet
          </h2>
          <div className="text-white/80 text-base space-y-3">
            <p>
              SeuraavaBussi.fi ei käytä evästeitä eikä kolmannen osapuolen
              seurantapalveluita. Emme kerää analytiikkatietoja käyttäjistämme.
            </p>
          </div>
        </section>

        {/* Rekisteröidyn oikeudet */}
        <section className="mb-8">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-3">
            7. Rekisteröidyn oikeudet
          </h2>
          <div className="text-white/80 text-base space-y-3">
            <p>
              GDPR:n mukaisesti sinulla on seuraavat oikeudet:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>Oikeus saada pääsy tietoihin:</strong> Koska emme tallenna
                tietojasi, ei ole tietoja joihin pääsyä voisi pyytää.
              </li>
              <li>
                <strong>Oikeus tietojen oikaisemiseen:</strong> Ei sovellettavissa,
                koska emme tallenna tietoja.
              </li>
              <li>
                <strong>Oikeus tietojen poistamiseen:</strong> Voit poistaa
                selaimeesi tallennetun sijaintitiedon tyhjentämällä selaimen
                localStorage-muistin tai selaimen asetuksista.
              </li>
              <li>
                <strong>Oikeus peruuttaa suostumus:</strong> Voit milloin tahansa
                peruuttaa sijaintiluvan selaimen asetuksista.
              </li>
              <li>
                <strong>Oikeus tehdä valitus valvontaviranomaiselle:</strong> Voit
                tehdä valituksen tietosuojavaltuutetun toimistoon
                (tietosuoja.fi).
              </li>
            </ul>
          </div>
        </section>

        {/* Tietoturva */}
        <section className="mb-8">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-3">
            8. Tietoturva
          </h2>
          <div className="text-white/80 text-base space-y-3">
            <p>
              Kaikki tiedonsiirto tapahtuu salatun HTTPS-yhteyden kautta.
              Koska emme tallenna henkilötietoja palvelimillemme, tietoturvariskit
              ovat minimaaliset.
            </p>
          </div>
        </section>

        {/* Muutokset */}
        <section className="mb-8">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-3">
            9. Muutokset tietosuojaselosteeseen
          </h2>
          <div className="text-white/80 text-base space-y-3">
            <p>
              Pidätämme oikeuden päivittää tätä tietosuojaselostetta.
              Olennaisista muutoksista ilmoitetaan palvelun etusivulla.
              Suosittelemme tarkistamaan tämän sivun säännöllisesti.
            </p>
          </div>
        </section>

        {/* Yhteystiedot */}
        <section className="mb-8">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-3">
            10. Yhteystiedot
          </h2>
          <div className="text-white/80 text-base space-y-3">
            <p>
              Jos sinulla on kysyttävää tietosuojasta, ota yhteyttä:
            </p>
            <p>
              <a
                href="mailto:zhiyuan.liu023@gmail.com"
                className="underline hover:text-white"
              >
                zhiyuan.liu023@gmail.com
              </a>
            </p>
            <p className="text-white/60 text-sm mt-4">
              Valvontaviranomainen: Tietosuojavaltuutetun toimisto
              <br />
              <a
                href="https://tietosuoja.fi"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white/80"
              >
                tietosuoja.fi
              </a>
            </p>
          </div>
        </section>

        <div className="pt-4 border-t border-white/20">
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
