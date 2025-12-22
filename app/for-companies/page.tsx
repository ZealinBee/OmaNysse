"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForCompanies() {
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
          Hallintapaneeli yrityksille
        </h1>

        <p className="text-white/80 text-base sm:text-lg mb-8">
          Olen nähnyt monia yrityksiä, joilla on aikataulunäyttöjä auloissaan.
          Haluan tehdä tästä helppoa ja muokattavaa.
        </p>

        <h2 className="text-white font-bold text-lg sm:text-xl mb-4">
          Ominaisuudet
        </h2>
        <ul className="text-white/80 text-base sm:text-lg mb-8 space-y-2">
          <li>• Koko näytön tila, optimoitu suurille näytöille</li>
          <li>• Kulkuvälineiden valinta (bussi, ratikka, metro)</li>
          <li>• Oma logo näytön yläosaan</li>
          <li>• Kattavat asennusohjeet</li>
          <li>• Kävelyaika pysäkille</li>
        </ul>

        <h2 className="text-white font-bold text-lg sm:text-xl mb-2">
          Hinta
        </h2>
        <p className="text-white/80 text-base sm:text-lg mb-8">
          20 € / kuukausi / näyttö
        </p>

        <h2 className="text-white font-bold text-lg sm:text-xl mb-4">
          Odotuslista
        </h2>
        <p className="text-white/80 text-base sm:text-lg mb-4">
          En tiedä vielä, kuinka kiinnostuneita yritykset ovat tästä.
          Jos saan 50 henkilöä odotuslistalle, teen ominaisuuden heti.
        </p>
        <p className="text-white font-bold text-base sm:text-lg mb-6">
          Ensimmäiset 50 saavat palvelun hintaan 10 € / kk / näyttö pysyvästi.
        </p>

        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSedgMjauci-tTmQ5jG1EKVXVQFle97YnKzo3vmqbMJVTVSCog/viewform"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-white rounded-lg font-bold text-base text-[#1b57cf] hover:opacity-90 transition-opacity mb-8"
        >
          Liity odotuslistalle
        </a>

        <div className="pt-4">
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
