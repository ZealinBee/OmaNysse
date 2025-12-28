import type { MetadataRoute } from "next";
import { CITY_SLUGS } from "@/app/lib/cities";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://seuraavabussi.fi";

  // City pages
  const cityPages: MetadataRoute.Sitemap = CITY_SLUGS.map((city) => ({
    url: `${baseUrl}/${city}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...cityPages,
    {
      url: `${baseUrl}/plus`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/for-companies`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/tietosuoja`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
