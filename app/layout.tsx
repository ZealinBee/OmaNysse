import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AuthProvider } from "./lib/supabase/auth-context";
import { LocaleProvider } from "./lib/locale-context";
import { type Locale } from "@/i18n/config";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Seuraava Bussi - Bussit, ratikat, metrot ja junat reaaliajassa",
  description: "Näyttää lähipysäkkien bussit, raitiovaunut, metrot ja VR-junat reaaliajassa. Toimii HSL:n, Nyssen, Fölin ja muiden kaupunkien alueilla. | Real-time arrivals for buses, trams, metros, and VR trains at nearby stops across Finland.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  metadataBase: new URL("https://seuraavabussi.fi"),
  openGraph: {
    title: "Seuraava Bussi - Bussit, ratikat, metrot ja junat reaaliajassa",
    description: "Näyttää lähipysäkkien bussit, raitiovaunut, metrot ja VR-junat reaaliajassa. Toimii HSL:n, Nyssen, Fölin ja muiden kaupunkien alueilla.",
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
    alternateLocale: "en_US",
    siteName: "Seuraava Bussi",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seuraava Bussi - Buses, trams, metros & trains in real-time",
    description: "Shows real-time arrivals for buses, trams, metros, and VR trains at nearby stops across Finland.",
    images: ["/banner.png"],
  },
  keywords: ["bussi", "raitiovaunu", "ratikka", "metro", "juna", "VR", "aikataulu", "julkinen liikenne", "HSL", "Nysse", "Föli", "Linkki", "reaaliaikainen", "bus", "tram", "train", "public transport", "real-time"],
  authors: [{ name: "Zhiyuan Liu" }],
  creator: "Zhiyuan Liu",
  applicationName: "Seuraava Bussi",
  category: "travel",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Seuraava Bussi",
  description: "Näyttää lähipysäkkien bussit, raitiovaunut, metrot ja VR-junat reaaliajassa. | Real-time arrivals for buses, trams, metros, and VR trains at nearby stops.",
  url: "https://seuraavabussi.fi",
  applicationCategory: "TravelApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript and Geolocation API",
  inLanguage: ["fi", "en"],
  isAccessibleForFree: false,
  offers: [
    {
      "@type": "Offer",
      name: "Ilmainen",
      price: "0",
      priceCurrency: "EUR",
    },
    {
      "@type": "Offer",
      name: "Plus",
      price: "2.99",
      priceCurrency: "EUR",
      priceValidUntil: "2026-12-31",
    },
  ],
  author: {
    "@type": "Person",
    name: "Zhiyuan Liu",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale() as Locale;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <LocaleProvider initialLocale={locale}>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LocaleProvider>
        </NextIntlClientProvider>
        <Analytics />
        <Script
          src="https://scripts.simpleanalyticscdn.com/latest.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
