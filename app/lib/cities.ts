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
  },
};

export const CITY_SLUGS = Object.keys(CITIES);

export function getCityBySlug(slug: string): CityConfig | undefined {
  return CITIES[slug];
}
