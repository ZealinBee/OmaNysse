import { Metadata } from "next";
import { PlusPageClient } from "./PlusPageClient";

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
  return <PlusPageClient />;
}
