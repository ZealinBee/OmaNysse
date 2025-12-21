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
  },
  twitter: {
    card: "summary_large_image",
    title: "Seuraava Bussi - Näe milloin seuraava bussi on lähdössä",
    description: "Näyttää lähellä olevien pysäkkien seuraavat bussit reaaliajassa.",
    images: ["/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
