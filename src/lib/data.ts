export const company = {
  name: "Baltic Freight GmbH",
  claim: "Spedition & Logistik aus Falkenwalde",
  founded: 2007,
  street: "Industriestraße 7-12",
  zip: "17337",
  city: "Falkenwalde",
  phone: "",
  email: "",
  disposition_email: "",
  karriere_email: "",
  mapsQuery: "Industriestraße 7-12, Falkenwalde, Vorpommern-Greifswald",
};

/**
 * Impressum/Datenschutz "verantwortliche Person" — deliberately separate from
 * `company` above. This site presents a fictional Spedition ("Baltic Freight
 * GmbH"), but German law (§5 TMG, DSGVO) requires the real operator to be
 * named with a real address/contact, not the in-universe company.
 */
export const legalContact = {
  name: "Lucas Ehlers",
  street: "Lensahner Straße 3",
  zip: "23758",
  city: "Wangels OT Hansühn",
  phone: "01725111069",
  email: "presse.lucas.ehlers@gmail.com",
};

export const navLinks = [
  { href: "/leistungen", label: "Leistungen" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/fuhrpark", label: "Fuhrpark" },
  { href: "/news", label: "News" },
  { href: "/karriere", label: "Karriere" },
  { href: "/rezensionen", label: "Rezensionen" },
  { href: "/partner", label: "Partner" },
  { href: "/standort", label: "Standort" },
];

export type Service = {
  slug: string;
  title: string;
  short: string;
  description: string;
  points: string[];
  icon: "truck" | "warehouse" | "route" | "globe" | "shield" | "clock";
};

export const services: Service[] = [
  {
    slug: "nationale-transporte",
    title: "Nationale Transporte",
    short: "Termingerechte Komplett- und Teilladungen in ganz Deutschland.",
    description:
      "Mit unserem modernen Fuhrpark und einer eingespielten Disposition bewegen wir Ihre Ware zuverlässig zwischen allen Wirtschaftsräumen Deutschlands – von der Einzelpalette bis zur Komplettladung.",
    points: ["Komplett- und Teilladungen", "Tagesfeste Termine", "Live-Sendungsverfolgung", "24h-Express auf Anfrage"],
    icon: "truck",
  },
  {
    slug: "internationale-transporte",
    title: "Internationale Transporte",
    short: "Grenzüberschreitende Verkehre im Ostseeraum und across Europa.",
    description:
      "Durch unsere Lage nahe der deutsch-polnischen Grenze sind wir spezialisiert auf Verkehre in den Baltikum- und Ostseeraum sowie klassische Westeuropa-Relationen.",
    points: ["Baltikum & Skandinavien", "Polen, Tschechien, Benelux", "Zollabwicklung", "Mehrsprachige Disposition"],
    icon: "globe",
  },
  {
    slug: "lagerlogistik",
    title: "Lagerlogistik & Kontraktlogistik",
    short: "Ein- und Auslagerung, Kommissionierung, Bestandsführung.",
    description:
      "In unserem Logistikzentrum in Falkenwalde bieten wir Lagerflächen mit digitaler Bestandsführung, Kommissionierung und Value-Added-Services für Ihre Waren.",
    points: ["Lagerflächen mit digitaler Bestandsführung", "Digitale Inventuren", "Kommissionierung & Verpackung", "Cross-Docking"],
    icon: "warehouse",
  },
  {
    slug: "disposition-tracking",
    title: "Disposition & Tracking",
    short: "Digitale Disposition mit voller Transparenz für Sie.",
    description:
      "Unsere hauseigene Disposition plant Touren in Echtzeit und hält Sie über den Status Ihrer Sendung jederzeit auf dem Laufenden.",
    points: ["Echtzeit-Tourenplanung", "Digitales Fahrtenbuch", "Statusmeldungen per E-Mail", "Kundenportal in Vorbereitung"],
    icon: "route",
  },
  {
    slug: "gefahrgut-spezialtransporte",
    title: "Gefahrgut & Spezialtransporte",
    short: "ADR-geschulte Fahrer für sensible und großformatige Ladungen.",
    description:
      "Für besondere Anforderungen stellen wir geschultes Personal und geeignetes Equipment bereit – von Gefahrguttransporten bis zu übergroßen Ladungen.",
    points: ["ADR-zertifizierte Fahrer", "Temperaturgeführte Transporte", "Schwerlast auf Anfrage", "Individuelle Beratung"],
    icon: "shield",
  },
  {
    slug: "same-day-express",
    title: "Same-Day & Express",
    short: "Wenn es schnell gehen muss – planbar und zuverlässig.",
    description:
      "Für eilige Sendungen bieten wir Express- und Same-Day-Verkehre mit fester Ansprechperson in der Disposition.",
    points: ["Same-Day im Nordosten", "Feste Ansprechpartner", "Direktfahrten möglich", "Rund um die Uhr erreichbar"],
    icon: "clock",
  },
];

export type TeamMember = {
  name: string;
  role: string;
  department: string;
  bio: string;
  initials: string;
};

export const management: TeamMember[] = [
  {
    name: "Mark Winter",
    role: "Geschäftsführer",
    department: "Geschäftsleitung",
    bio: "Verantwortet Strategie, Vertrieb und die Entwicklung der Baltic Freight GmbH.",
    initials: "MW",
  },
  {
    name: "Lucas Summer",
    role: "Geschäftsführer",
    department: "Geschäftsleitung",
    bio: "Verantwortet Finanzen, Personal und die operative Steuerung der Baltic Freight GmbH.",
    initials: "LS",
  },
];

export const keyPositions: TeamMember[] = [];

export type FleetVehicle = {
  category: string;
  count: number;
  description: string;
  features: string[];
};

export const fleet: FleetVehicle[] = [];

export type NewsPost = {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: string[];
};

export const news: NewsPost[] = [];

export type Job = {
  slug: string;
  title: string;
  location: string;
  type: string;
  department: string;
  description: string;
  tasks: string[];
  requirements: string[];
};

export const jobs: Job[] = [
  {
    slug: "berufskraftfahrer-ce",
    title: "Berufskraftfahrer (m/w/d) CE",
    location: "Falkenwalde",
    type: "Vollzeit",
    department: "Fuhrpark",
    description:
      "Zur Verstärkung unseres Fahrerteams suchen wir Berufskraftfahrer für nationale und internationale Touren.",
    tasks: [
      "Durchführung von Nah- und Fernverkehrstouren",
      "Be- und Entladung sowie Ladungssicherung",
      "Digitale Dokumentation über die Disposition",
      "Freundlicher Umgang mit Kunden vor Ort",
    ],
    requirements: [
      "Führerschein Klasse CE mit Berufskraftfahrerqualifikation",
      "Fahrerkarte und aktuelle Module nach BKrFQG",
      "Zuverlässigkeit und Teamfähigkeit",
      "Erste Erfahrung im internationalen Verkehr von Vorteil",
    ],
  },
  {
    slug: "azubi-berufskraftfahrer",
    title: "Ausbildung Berufskraftfahrer (m/w/d) CE",
    location: "Falkenwalde",
    type: "Ausbildung",
    department: "Fuhrpark",
    description: "Starte deine Karriere hinterm Steuer – wir bilden dich zum Berufskraftfahrer aus.",
    tasks: [
      "Praxisnahe Ausbildung im Nah- und Fernverkehr",
      "Begleitung durch erfahrene Berufskraftfahrer",
      "Kennenlernen von Ladungssicherung und Fahrzeugtechnik",
      "Vorbereitung auf die Berufskraftfahrerqualifikation",
    ],
    requirements: [
      "Führerschein Klasse B von Vorteil, CE wird begleitet erworben",
      "Zuverlässigkeit und Verantwortungsbewusstsein",
      "Freude am Fahren und am Umgang mit Menschen",
      "Guter Hauptschulabschluss oder vergleichbar",
    ],
  },
  {
    slug: "disponent",
    title: "Disponent (m/w/d)",
    location: "Falkenwalde",
    type: "Vollzeit",
    department: "Disposition",
    description:
      "Für unser Dispositionsteam suchen wir eine engagierte Persönlichkeit, die Touren plant und unsere Fahrer sowie Kunden koordiniert.",
    tasks: [
      "Planung und Steuerung nationaler und internationaler Transporte",
      "Kommunikation mit Fahrern, Kunden und Partnern",
      "Überwachung von Terminen und Lieferqualität",
      "Angebotserstellung und Kundenbetreuung",
    ],
    requirements: [
      "Abgeschlossene Ausbildung als Kaufmann/-frau für Spedition und Logistikdienstleistung oder vergleichbar",
      "Erste Berufserfahrung in der Disposition wünschenswert",
      "Belastbarkeit und Organisationstalent",
      "Sicherer Umgang mit gängiger Bürosoftware",
    ],
  },
  {
    slug: "azubi-disponent",
    title: "Ausbildung Kaufmann/-frau für Spedition und Logistikdienstleistung",
    location: "Falkenwalde",
    type: "Ausbildung",
    department: "Disposition",
    description: "Starte deine Karriere in der Logistik mit einer praxisnahen Ausbildung bei Baltic Freight.",
    tasks: [
      "Einblicke in Disposition, Vertrieb und Verwaltung",
      "Mitarbeit an nationalen und internationalen Transporten",
      "Kennenlernen speditioneller Abläufe von A bis Z",
      "Begleitung durch feste Ausbildungspaten",
    ],
    requirements: [
      "Guter Realschulabschluss oder (Fach-)Abitur",
      "Interesse an Logistik und internationalem Handel",
      "Organisationstalent und Kommunikationsfreude",
      "Gute Deutschkenntnisse",
    ],
  },
];

export type Review = {
  author: string;
  company: string;
  rating: number;
  text: string;
  date: string;
};

export const reviews: Review[] = [];

export type Partner = {
  name: string;
  category: string;
};

export const partners: Partner[] = [
  { name: "Freiwillige Feuerwehr Falkenwalde – Löschzug 11", category: "Getränke-, Werkzeug- & Materiallieferungen" },
];
