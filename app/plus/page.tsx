import { Metadata } from "next";
import { PlusPageClient } from "./PlusPageClient";

export const metadata: Metadata = {
  title: "SeuraavaBussi Plus | SeuraavaBussi.fi",
  description:
    "Hanki SeuraavaBussi Plus ja näe bussien, ratikoiden, metrojen ja junien sijainnit kartalla reaaliajassa. 3€/kk tai 30€ kertamaksulla. | Get SeuraavaBussi Plus and see buses, trams, metros, and trains on a live map.",
  openGraph: {
    title: "SeuraavaBussi Plus | SeuraavaBussi.fi",
    description:
      "Hanki SeuraavaBussi Plus ja näe bussien, ratikoiden, metrojen ja junien sijainnit kartalla reaaliajassa. 3€/kk tai 30€ kertamaksulla.",
    url: "https://seuraavabussi.fi/plus",
    siteName: "SeuraavaBussi.fi",
    locale: "fi_FI",
    type: "website",
  },
};

export default function PlusPage() {
  return <PlusPageClient />;
}
