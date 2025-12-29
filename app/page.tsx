import { Metadata } from "next";
import PageWrapper from "./components/PageWrapper";
import { FooterContent } from "./components/FooterContent";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://seuraavabussi.fi",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Miten SeuraavaBussi.fi toimii?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sovellus käyttää sijaintiasi tai hakemaasi osoitetta löytääkseen lähimmät pysäkit. Lähtöajat haetaan reaaliaikaisesti joukkoliikenteen rajapinnoista ja päivitetään automaattisesti 30 sekunnin välein.",
      },
    },
    {
      "@type": "Question",
      name: "Ovatko bussilähtöajat reaaliaikaisia?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kyllä, lähtöajat perustuvat reaaliaikaiseen GPS-seurantaan aina kun se on saatavilla. Jos reaaliaikatietoa ei ole, näytetään aikataulun mukainen lähtöaika.",
      },
    },
    {
      "@type": "Question",
      name: "Onko SeuraavaBussi.fi ilmainen?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SeuraavaBussi.fi:n perustoiminnot ovat ilmaisia. Tarjoamme myös maksullisia lisäominaisuuksia, kuten live-kartta ja kotinäkymä-widget.",
      },
    },
    {
      "@type": "Question",
      name: "Voinko käyttää sovellusta ilman sijaintia?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kyllä, voit hakea lähtöjä minkä tahansa osoitteen tai paikan läheltä käyttämällä hakutoimintoa.",
      },
    },
  ],
};

export default function Home() {
  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FooterContent />
    </PageWrapper>
  );
}
