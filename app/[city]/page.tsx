import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CITIES, CITY_SLUGS, getCityBySlug } from "@/app/lib/cities";
import CityPageClient from "./CityPageClient";

interface CityPageProps {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }));
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { city } = await params;
  const cityConfig = getCityBySlug(city);

  if (!cityConfig) {
    return {
      title: "Sivu ei löytynyt",
    };
  }

  return {
    title: cityConfig.metaTitle,
    description: cityConfig.metaDescription,
    keywords: [
      cityConfig.name,
      cityConfig.operator,
      "bussi",
      "ratikka",
      "raitiovaunu",
      "metro",
      "juna",
      "aikataulu",
      "joukkoliikenne",
      "reaaliaikainen",
      "bus",
      "tram",
      "train",
      "public transport",
      "real-time",
      ...cityConfig.features.map((f) => f.toLowerCase()),
    ],
    openGraph: {
      title: cityConfig.metaTitle,
      description: cityConfig.metaDescription,
      url: `https://seuraavabussi.fi/${cityConfig.slug}`,
      siteName: "SeuraavaBussi.fi",
      locale: "fi_FI",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: cityConfig.metaTitle,
      description: cityConfig.metaDescription,
    },
    alternates: {
      canonical: `https://seuraavabussi.fi/${cityConfig.slug}`,
    },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { city } = await params;
  const cityConfig = getCityBySlug(city);

  if (!cityConfig) {
    notFound();
  }

  return <CityPageClient city={cityConfig} />;
}
