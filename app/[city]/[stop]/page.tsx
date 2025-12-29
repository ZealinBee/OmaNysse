import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCityBySlug } from "@/app/lib/cities";
import { getStopBySlug, getAllStopParams } from "@/app/lib/stops";
import StopPageClient from "./StopPageClient";

interface StopPageProps {
  params: Promise<{ city: string; stop: string }>;
}

export async function generateStaticParams() {
  return getAllStopParams();
}

export async function generateMetadata({
  params,
}: StopPageProps): Promise<Metadata> {
  const { city, stop } = await params;
  const cityConfig = getCityBySlug(city);
  const stopConfig = getStopBySlug(city, stop);

  if (!cityConfig || !stopConfig) {
    return {
      title: "Sivu ei löytynyt",
    };
  }

  return {
    title: stopConfig.metaTitle,
    description: stopConfig.metaDescription,
    keywords: [
      stopConfig.name,
      cityConfig.name,
      cityConfig.operator,
      "bussi",
      "ratikka",
      "raitiovaunu",
      "metro",
      "juna",
      "aikataulu",
      "pysäkki",
      "joukkoliikenne",
      "reaaliaikainen",
      "bus",
      "tram",
      "train",
      "stop",
      "public transport",
      "real-time",
    ],
    openGraph: {
      title: stopConfig.metaTitle,
      description: stopConfig.metaDescription,
      url: `https://seuraavabussi.fi/${cityConfig.slug}/${stopConfig.slug}`,
      siteName: "SeuraavaBussi.fi",
      locale: "fi_FI",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: stopConfig.metaTitle,
      description: stopConfig.metaDescription,
    },
    alternates: {
      canonical: `https://seuraavabussi.fi/${cityConfig.slug}/${stopConfig.slug}`,
    },
  };
}

export default async function StopPage({ params }: StopPageProps) {
  const { city, stop } = await params;
  const cityConfig = getCityBySlug(city);
  const stopConfig = getStopBySlug(city, stop);

  if (!cityConfig || !stopConfig) {
    notFound();
  }

  return <StopPageClient city={cityConfig} stop={stopConfig} />;
}
