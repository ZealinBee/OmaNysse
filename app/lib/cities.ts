export interface CityConfig {
  slug: string;
  name: string;
  operator: string;
  operatorName: string;
  coords: { lat: number; lng: number };
  locationName: string;
  color: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  lines: string; // Example popular lines
  features: string[];
  walttiSlug?: string; // Waltti API slug for GTFS-RT vehicle positions (only cities with vehicle data)
}

export const CITIES: Record<string, CityConfig> = {
  helsinki: {
    slug: "helsinki",
    name: "Helsinki",
    operator: "HSL",
    operatorName: "Helsingin seudun liikenne",
    coords: { lat: 60.1699, lng: 24.9384 },
    locationName: "Rautatientori, Helsinki",
    color: "#007AC9",
    description:
      "HSL operoi Helsingin seudun joukkoliikennettä, johon kuuluvat bussit, raitiovaunut, metro ja lähijunat. Verkosto kattaa Helsingin, Espoon, Vantaan ja lähikunnat. HSL:n alueella liikkuu päivittäin yli miljoona matkustajaa.",
    metaTitle: "Bussit Helsingissä - HSL aikataulut reaaliajassa",
    metaDescription:
      "Katso Helsingin bussien, ratikoiden ja metron aikataulut reaaliajassa. Näe lähimmät HSL-pysäkit ja seuraavat lähdöt kartalla.",
    lines: "Esim. linjat 550, 510, 65A",
    features: ["Bussit", "Raitiovaunut", "Metro", "Lähijunat"],
  },
  tampere: {
    slug: "tampere",
    name: "Tampere",
    operator: "Nysse",
    operatorName: "Tampereen seudun joukkoliikenne",
    coords: { lat: 61.4978, lng: 23.761 },
    locationName: "Keskustori, Tampere",
    color: "#1b57cf",
    description:
      "Nysse on Tampereen seudun joukkoliikenteen brändi. Nysse operoi busseja Tampereella ja ympäristökunnissa sekä Suomen ensimmäistä raitiotietä, joka avattiin vuonna 2021. Raitiotie yhdistää Hervannnan, keskustan ja Taysin.",
    metaTitle: "Bussit Tampereella - Nysse aikataulut reaaliajassa",
    metaDescription:
      "Katso Tampereen Nysse-bussien ja ratikoiden aikataulut reaaliajassa. Näe lähimmät pysäkit ja seuraavat lähdöt.",
    lines: "Esim. linjat 1, 3, 8",
    features: ["Bussit", "Raitiotie"],
  },
  turku: {
    slug: "turku",
    name: "Turku",
    operator: "Föli",
    operatorName: "Turun seudun joukkoliikenne",
    coords: { lat: 60.4518, lng: 22.2666 },
    locationName: "Kauppatori, Turku",
    color: "#00A19C",
    description:
      "Föli on Turun seudun joukkoliikenteen brändi, joka kattaa Turun, Kaarinan, Raision, Naantalin ja Liedon. Föli operoi laajaa bussverkostoa sekä kaupunkipyöräjärjestelmää. Keskustasta pääsee helposti joka suuntaan.",
    metaTitle: "Bussit Turussa - Föli aikataulut reaaliajassa",
    metaDescription:
      "Katso Turun Föli-bussien aikataulut reaaliajassa. Näe lähimmät pysäkit ja seuraavat lähdöt Turun seudulla.",
    lines: "Esim. linjat 1, 6, 32",
    features: ["Bussit", "Kaupunkipyörät"],
  },
  oulu: {
    slug: "oulu",
    name: "Oulu",
    operator: "OSL",
    operatorName: "Oulun seudun liikenne",
    coords: { lat: 65.0121, lng: 25.4651 },
    locationName: "Torinranta, Oulu",
    color: "#E30A69",
    description:
      "Oulun seudun liikenne (OSL) operoi bussiliikennettä Oulussa ja lähikunnissa. Oulu on Suomen viidenneksi suurin kaupunki ja tunnettu myös maailman parhaana pyöräilykaupunkina.",
    metaTitle: "Bussit Oulussa - OSL aikataulut reaaliajassa",
    metaDescription:
      "Katso Oulun bussien aikataulut reaaliajassa. Näe lähimmät OSL-pysäkit ja seuraavat lähdöt Oulun seudulla.",
    lines: "Esim. linjat 1, 5, 19",
    features: ["Bussit"],
    walttiSlug: "oulu",
  },
  jyvaskyla: {
    slug: "jyvaskyla",
    name: "Jyväskylä",
    operator: "Linkki",
    operatorName: "Jyväskylän seudun joukkoliikenne",
    coords: { lat: 62.2426, lng: 25.7473 },
    locationName: "Matkakeskus, Jyväskylä",
    color: "#109D2C",
    description:
      "Linkki on Jyväskylän seudun joukkoliikenteen brändi. Linkki operoi busseja Jyväskylässä ja lähikunnissa. Matkakeskus toimii liikenteen keskipisteenä, josta pääsee helposti kaikkialle kaupunkiin.",
    metaTitle: "Bussit Jyväskylässä - Linkki aikataulut reaaliajassa",
    metaDescription:
      "Katso Jyväskylän Linkki-bussien aikataulut reaaliajassa. Näe lähimmät pysäkit ja seuraavat lähdöt.",
    lines: "Esim. linjat 1, 12, 25",
    features: ["Bussit"],
    walttiSlug: "jyvaskyla",
  },
  lahti: {
    slug: "lahti",
    name: "Lahti",
    operator: "LSL",
    operatorName: "Lahden seudun liikenne",
    coords: { lat: 60.9827, lng: 25.6556 },
    locationName: "Matkakeskus, Lahti",
    color: "#1570B8",
    description:
      "Lahden seudun liikenne (LSL) operoi bussiliikennettä Lahdessa ja lähikunnissa. Lahti on Suomen kahdeksanneksi suurin kaupunki ja tunnettu urheilukaupunkina. Matkakeskus yhdistää bussi- ja junaliikenteen.",
    metaTitle: "Bussit Lahdessa - LSL aikataulut reaaliajassa",
    metaDescription:
      "Katso Lahden bussien aikataulut reaaliajassa. Näe lähimmät LSL-pysäkit ja seuraavat lähdöt Lahden seudulla.",
    lines: "Esim. linjat 1, 3, 12",
    features: ["Bussit"],
    walttiSlug: "lahti",
  },
  kuopio: {
    slug: "kuopio",
    name: "Kuopio",
    operator: "Vilkku",
    operatorName: "Kuopion seudun joukkoliikenne",
    coords: { lat: 62.8925, lng: 27.6783 },
    locationName: "Keskusta, Kuopio",
    color: "#554096",
    description:
      "Vilkku on Kuopion seudun joukkoliikenteen brändi. Kuopio on Suomen yhdeksänneksi suurin kaupunki, tunnettu Puijon tornista ja kalakukosta. Bussit kulkevat keskustasta kaikkiin kaupunginosiin.",
    metaTitle: "Bussit Kuopiossa - Vilkku aikataulut reaaliajassa",
    metaDescription:
      "Katso Kuopion Vilkku-bussien aikataulut reaaliajassa. Näe lähimmät pysäkit ja seuraavat lähdöt Kuopion seudulla.",
    lines: "Esim. linjat 1, 4, 16",
    features: ["Bussit"],
  },
  lappeenranta: {
    slug: "lappeenranta",
    name: "Lappeenranta",
    operator: "Jouko",
    operatorName: "Etelä-Karjalan joukkoliikenne",
    coords: { lat: 61.0587, lng: 28.1887 },
    locationName: "Keskusta, Lappeenranta",
    color: "#DD3189",
    description:
      "Jouko on Etelä-Karjalan joukkoliikenteen brändi. Lappeenranta sijaitsee Saimaan rannalla lähellä Venäjän rajaa. Jouko operoi busseja Lappeenrannassa, Imatralla ja ympäristökunnissa.",
    metaTitle: "Bussit Lappeenrannassa - Jouko aikataulut reaaliajassa",
    metaDescription:
      "Katso Lappeenrannan Jouko-bussien aikataulut reaaliajassa. Näe lähimmät pysäkit ja seuraavat lähdöt.",
    lines: "Esim. linjat 1, 3, 5",
    features: ["Bussit"],
  },
  hameenlinna: {
    slug: "hameenlinna",
    name: "Hämeenlinna",
    operator: "HLi",
    operatorName: "Hämeenlinnan joukkoliikenne",
    coords: { lat: 60.9945, lng: 24.4642 },
    locationName: "Keskusta, Hämeenlinna",
    color: "#C3291E",
    description:
      "Hämeenlinnan joukkoliikenne operoi busseja Hämeenlinnassa ja lähialueilla. Hämeenlinna on historiallinen kaupunki, tunnettu linnastaan ja Sibeliuksen syntymäpaikkana. Keskustasta pääsee bussilla kaikkialle.",
    metaTitle: "Bussit Hämeenlinnassa - Bussiaikataulut reaaliajassa",
    metaDescription:
      "Katso Hämeenlinnan bussien aikataulut reaaliajassa. Näe lähimmät pysäkit ja seuraavat lähdöt.",
    lines: "Esim. linjat 1, 2, 4",
    features: ["Bussit"],
  },
  pori: {
    slug: "pori",
    name: "Pori",
    operator: "Pori",
    operatorName: "Porin joukkoliikenne",
    coords: { lat: 61.4851, lng: 21.7975 },
    locationName: "Keskusta, Pori",
    color: "#00ADEF",
    description:
      "Porin joukkoliikenne operoi busseja Porissa ja lähialueilla. Pori on Suomen kymmenenneksi suurin kaupunki, tunnettu Pori Jazz -festivaalista ja Yyterin hiekkarannasta. Keskustasta pääsee bussilla koko kaupunkiin.",
    metaTitle: "Bussit Porissa - Bussiaikataulut reaaliajassa",
    metaDescription:
      "Katso Porin bussien aikataulut reaaliajassa. Näe lähimmät pysäkit ja seuraavat lähdöt Porin seudulla.",
    lines: "Esim. linjat 1, 3, 40",
    features: ["Bussit"],
  },
};

export const CITY_SLUGS = Object.keys(CITIES);

export function getCityBySlug(slug: string): CityConfig | undefined {
  return CITIES[slug];
}

// Cities that have real-time vehicle position tracking available
// Helsinki (HSL), Tampere (ITS Factory), Turku (Föli), and Waltti cities with walttiSlug
export function cityHasVehiclePositions(slug: string | null | undefined): boolean {
  if (!slug) return false;

  // HSL, Tampere, and Turku always have vehicle positions
  if (slug === "helsinki" || slug === "tampere" || slug === "turku") {
    return true;
  }

  // Check if it's a Waltti city with vehicle position data
  const city = CITIES[slug];
  return !!city?.walttiSlug;
}

// Get list of cities that support vehicle positions (for display purposes)
export function getCitiesWithVehiclePositions(): string[] {
  return Object.entries(CITIES)
    .filter(([slug]) => cityHasVehiclePositions(slug))
    .map(([, config]) => config.name);
}
