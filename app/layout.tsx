import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Seuraava Bussi - Näe milloin seuraava bussi on lähdössä",
  description: "Näyttää lähellä olevien pysäkkien seuraavat bussit reaaliajassa.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  ),
  openGraph: {
    title: "Seuraava Bussi - Näe milloin seuraava bussi on lähdössä",
    description: "Näyttää lähellä olevien pysäkkien seuraavat bussit reaaliajassa.",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "Seuraava Bussi",
      },
    ],
    type: "website",
    locale: "fi_FI",
    siteName: "Seuraava Bussi",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seuraava Bussi - Näe milloin seuraava bussi on lähdössä",
    description: "Näyttää lähellä olevien pysäkkien seuraavat bussit reaaliajassa.",
    images: ["/banner.png"],
  },
  keywords: ["bussi", "aikataulu", "julkinen liikenne", "HSL", "Nysse", "Föli", "Linkki", "reaaliaikainen"],
  authors: [{ name: "Zhiyuan Liu" }],
  creator: "Zhiyuan Liu",
  applicationName: "Seuraava Bussi",
  category: "travel",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Seuraava Bussi",
  description: "Näyttää lähellä olevien pysäkkien seuraavat bussit reaaliajassa.",
  url: "https://seuraavabussi.fi",
  applicationCategory: "TravelApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript and Geolocation API",
  inLanguage: "fi",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  author: {
    "@type": "Person",
    name: "Zhiyuan Liu",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    ratingCount: "1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
