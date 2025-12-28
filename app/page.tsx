import PageWrapper from "./components/PageWrapper";

export default function Home() {
  return (
    <PageWrapper>
      {/* SEO Footer - Server rendered for search engines */}
      <footer className="mt-16 pt-8 border-t border-white/20">
        <div className="text-white/70 text-sm space-y-8">
          {/* Service Description */}
          <section>
            <h2 className="text-white font-bold text-lg mb-3">
              Tietoa SeuraavaBussi.fi-palvelusta
            </h2>
            <p className="leading-relaxed">
              SeuraavaBussi.fi on ilmainen palvelu, joka näyttää reaaliaikaiset
              joukkoliikenteen lähtöajat läheltäsi. Sovellus hakee tiedot
              automaattisesti lähimmiltä pysäkeiltä ja näyttää seuraavat
              bussit, raitiovaunut ja junat selkeässä listassa. Voit myös hakea
              lähtöjä minkä tahansa osoitteen tai paikan läheltä.
            </p>
          </section>

          {/* Supported Regions */}
          <section>
            <h3 className="text-white font-bold text-base mb-3">
              Tuetut alueet Suomessa
            </h3>
            <ul className="grid grid-cols-2 gap-2">
              <li className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#007AC9" }}
                />
                <a href="/helsinki" className="hover:text-white transition-colors">
                  Helsinki (HSL)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#1b57cf" }}
                />
                <a href="/tampere" className="hover:text-white transition-colors">
                  Tampere (Nysse)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#00A19C" }}
                />
                <a href="/turku" className="hover:text-white transition-colors">
                  Turku (Föli)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#E30A69" }}
                />
                <a href="/oulu" className="hover:text-white transition-colors">
                  Oulu (OSL)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#109D2C" }}
                />
                <a href="/jyvaskyla" className="hover:text-white transition-colors">
                  Jyväskylä (Linkki)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#1570B8" }}
                />
                <a href="/lahti" className="hover:text-white transition-colors">
                  Lahti (LSL)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#554096" }}
                />
                <a href="/kuopio" className="hover:text-white transition-colors">
                  Kuopio (Vilkku)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#DD3189" }}
                />
                <a href="/lappeenranta" className="hover:text-white transition-colors">
                  Lappeenranta (Jouko)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#C3291E" }}
                />
                <a href="/hameenlinna" className="hover:text-white transition-colors">
                  Hämeenlinna
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#00ADEF" }}
                />
                <a href="/pori" className="hover:text-white transition-colors">
                  Pori
                </a>
              </li>
            </ul>
          </section>

          {/* FAQ */}
          <section>
            <h3 className="text-white font-bold text-base mb-3">
              Usein kysytyt kysymykset
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-white/90 font-semibold">
                  Miten sovellus toimii?
                </dt>
                <dd className="mt-1 text-white/60">
                  Sovellus käyttää sijaintiasi tai hakemaasi osoitetta
                  löytääkseen lähimmät pysäkit. Lähtöajat haetaan
                  reaaliaikaisesti joukkoliikenteen rajapinnoista ja
                  päivitetään automaattisesti 30 sekunnin välein.
                </dd>
              </div>
              <div>
                <dt className="text-white/90 font-semibold">
                  Ovatko lähtöajat reaaliaikaisia?
                </dt>
                <dd className="mt-1 text-white/60">
                  Kyllä, lähtöajat perustuvat reaaliaikaiseen GPS-seurantaan
                  aina kun se on saatavilla. Jos reaaliaikatietoa ei ole,
                  näytetään aikataulun mukainen lähtöaika.
                </dd>
              </div>
              <div>
                <dt className="text-white/90 font-semibold">
                  Onko sovellus ilmainen?
                </dt>
                <dd className="mt-1 text-white/60">
                  Kyllä, SeuraavaBussi.fi on täysin ilmainen käyttää. Voit
                  halutessasi tukea kehitystyötä kahvilahjoituksella.
                </dd>
              </div>
              <div>
                <dt className="text-white/90 font-semibold">
                  Voinko käyttää sovellusta ilman sijaintia?
                </dt>
                <dd className="mt-1 text-white/60">
                  Kyllä, voit hakea lähtöjä minkä tahansa osoitteen tai paikan
                  läheltä käyttämällä hakutoimintoa.
                </dd>
              </div>
            </dl>
          </section>

          {/* Data Sources */}
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
    </PageWrapper>
  );
}
