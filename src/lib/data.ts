export const company = {
  name: "Baltic Freight GmbH",
  claim: "Spedition & Logistik aus Falkenwalde",
  founded: 2007,
  street: "Ostseestraße 14",
  zip: "17337",
  city: "Falkenwalde",
  phone: "+49 3973 219 40",
  fax: "+49 3973 219 41",
  email: "info@baltic-freight.de",
  disposition_email: "disposition@baltic-freight.de",
  karriere_email: "karriere@baltic-freight.de",
  mapsQuery: "Falkenwalde, Vorpommern-Greifswald",
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
    points: ["12.000 m² Lagerfläche", "Digitale Inventuren", "Kommissionierung & Verpackung", "Cross-Docking"],
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
    name: "Torsten Wegner",
    role: "Geschäftsführer",
    department: "Geschäftsleitung",
    bio: "Gründete Baltic Freight 2007 und verantwortet Strategie, Vertrieb und internationale Partnerschaften.",
    initials: "TW",
  },
  {
    name: "Kristina Bahlke",
    role: "Geschäftsführerin, Prokuristin",
    department: "Geschäftsleitung & Finanzen",
    bio: "Leitet Finanzen, Controlling und Personalwesen und ist zweite Geschäftsführerin der Baltic Freight GmbH.",
    initials: "KB",
  },
];

export const keyPositions: TeamMember[] = [
  {
    name: "Marek Nowicki",
    role: "Leiter Disposition",
    department: "Disposition",
    bio: "Verantwortet die tägliche Tourenplanung sowie die Steuerung des Fuhrparks im In- und Ausland.",
    initials: "MN",
  },
  {
    name: "Sandra Lehmann",
    role: "Leiterin Lagerlogistik",
    department: "Lager & Kontraktlogistik",
    bio: "Organisiert Wareneingang, Kommissionierung und Inventuren im Logistikzentrum Falkenwalde.",
    initials: "SL",
  },
  {
    name: "Jonas Petersen",
    role: "Leiter Fuhrparkmanagement",
    department: "Fuhrpark & Werkstatt",
    bio: "Zuständig für Wartung, Prüftermine und die Digitalisierung von Fahrtenbuch und Fahrerkarten.",
    initials: "JP",
  },
  {
    name: "Anke Voss",
    role: "Leiterin Personal & Recruiting",
    department: "Personal",
    bio: "Erste Ansprechperson für Bewerbungen, Ausbildung und Mitarbeiterentwicklung.",
    initials: "AV",
  },
  {
    name: "Dennis Kramer",
    role: "Leiter Buchhaltung",
    department: "Finanzbuchhaltung",
    bio: "Verantwortet Rechnungsstellung, Debitoren- und Kreditorenbuchhaltung sowie das Reporting.",
    initials: "DK",
  },
  {
    name: "Piotr Zieliński",
    role: "Leiter Internationale Verkehre",
    department: "Disposition International",
    bio: "Koordiniert grenzüberschreitende Transporte in den Baltikum- und Ostseeraum.",
    initials: "PZ",
  },
];

export type FleetVehicle = {
  category: string;
  count: number;
  description: string;
  features: string[];
};

export const fleet: FleetVehicle[] = [
  {
    category: "Sattelzugmaschinen",
    count: 48,
    description: "Moderne Zugmaschinen der Euro-6-Klasse für nationale und internationale Fernverkehre.",
    features: ["Euro 6 / Euro 6E", "Abstandsregeltempomat", "Telematik & GPS-Tracking", "Ø Alter 2,4 Jahre"],
  },
  {
    category: "Standard-Sattelauflieger",
    count: 55,
    description: "Curtainsider und Kofferauflieger für Stückgut, Paletten und Komplettladungen.",
    features: ["Volumen bis 100 m³", "Zurrschienen & Ladungssicherung", "Doppelstockverladung möglich"],
  },
  {
    category: "Kühl- & Temperaturführung",
    count: 14,
    description: "Multi-Temperatur-Auflieger für temperaturgeführte Transporte.",
    features: ["-25 °C bis +25 °C", "Temperaturaufzeichnung", "Lebensmittel- & Pharmatransporte"],
  },
  {
    category: "Wechselbrücken & Solofahrzeuge",
    count: 22,
    description: "Flexible Fahrzeuge für Nahverkehr, Cross-Docking und Same-Day-Touren.",
    features: ["7,5 t bis 18 t", "Ladebordwand verfügbar", "Ideal für Stadtlogistik"],
  },
];

export type NewsPost = {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: string[];
};

export const news: NewsPost[] = [
  {
    slug: "erweiterung-logistikzentrum-falkenwalde",
    title: "Baltic Freight erweitert Logistikzentrum in Falkenwalde",
    date: "2026-07-14",
    category: "Unternehmen",
    excerpt:
      "Mit einer neuen Lagerhalle wächst unsere Lagerfläche in Falkenwalde auf über 12.000 m² – für noch mehr Kapazität in der Kontraktlogistik.",
    content: [
      "Baltic Freight investiert weiter in den Standort Falkenwalde: Mit einer neuen Halle wächst die verfügbare Lagerfläche auf über 12.000 m².",
      "Die Erweiterung schafft zusätzliche Kapazitäten für Kommissionierung, Cross-Docking und temperaturgeführte Lagerung und stärkt unsere Position als Logistikdrehscheibe im Ostseeraum.",
      "Die neue Halle soll im vierten Quartal 2026 in Betrieb genommen werden.",
    ],
  },
  {
    slug: "zehn-neue-euro6-sattelzugmaschinen",
    title: "Zehn neue Euro-6-Sattelzugmaschinen für den Fuhrpark",
    date: "2026-05-02",
    category: "Fuhrpark",
    excerpt:
      "Zehn weitere Zugmaschinen der neuesten Euro-6-Generation verstärken unsere Flotte und senken den durchschnittlichen CO₂-Ausstoß je Tour.",
    content: [
      "Zum Frühjahr 2026 hat Baltic Freight zehn neue Sattelzugmaschinen der neuesten Euro-6-Generation in Dienst gestellt.",
      "Die Fahrzeuge sind mit moderner Telematik ausgestattet und tragen zur weiteren Senkung unseres CO₂-Fußabdrucks je gefahrenem Kilometer bei.",
      "Damit umfasst unser Fuhrpark aktuell 48 Zugmaschinen und über 90 Auflieger verschiedener Bauart.",
    ],
  },
  {
    slug: "digitales-fahrtenbuch-rollout",
    title: "Digitales Fahrtenbuch für alle Fahrzeuge eingeführt",
    date: "2026-02-18",
    category: "Digitalisierung",
    excerpt:
      "Mit dem flächendeckenden Rollout des digitalen Fahrtenbuchs sind alle Touren jetzt lückenlos und rechtssicher dokumentiert.",
    content: [
      "Nach einer Pilotphase mit zehn Fahrzeugen läuft das digitale Fahrtenbuch nun flottenweit.",
      "Fahrer erfassen Fahrten direkt über ein Tablet im Führerhaus, die Disposition erhält in Echtzeit Einblick in Kilometerstände und Standorte.",
      "Das Projekt ist ein weiterer Baustein unserer Digitalisierungsstrategie, zu der auch die digitale Fahrerkarte und das interne Dispositionssystem gehören.",
    ],
  },
  {
    slug: "ausbildungsstart-2026",
    title: "Neun neue Auszubildende starten bei Baltic Freight",
    date: "2025-09-01",
    category: "Personal",
    excerpt:
      "Zum Ausbildungsjahr 2026 begrüßen wir neun neue Auszubildende in den Bereichen Spedition, Berufskraftfahrer und Lagerlogistik.",
    content: [
      "Wir freuen uns über neun neue Auszubildende, die zum 1. September ihre Ausbildung bei Baltic Freight begonnen haben.",
      "Die jungen Kolleginnen und Kollegen durchlaufen alle Fachbereiche – von der Disposition über die Lagerlogistik bis zum Fahrerhaus.",
      "Bewerbungen für das nächste Ausbildungsjahr nehmen wir laufend über unser Bewerbungsportal entgegen.",
    ],
  },
];

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
    slug: "berufskraftfahrer-cE",
    title: "Berufskraftfahrer (m/w/d) CE – Nah- & Fernverkehr",
    location: "Falkenwalde",
    type: "Vollzeit",
    department: "Fuhrpark",
    description:
      "Zur Verstärkung unseres Fahrerteams suchen wir Berufskraftfahrer für nationale und internationale Touren.",
    tasks: [
      "Durchführung von Nah- und Fernverkehrstouren",
      "Be- und Entladung sowie Ladungssicherung",
      "Digitale Dokumentation über Fahrtenbuch-App",
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
    slug: "disponent",
    title: "Disponent (m/w/d) Nationale Verkehre",
    location: "Falkenwalde",
    type: "Vollzeit",
    department: "Disposition",
    description:
      "Für unser Dispositionsteam suchen wir eine engagierte Persönlichkeit, die Touren plant und unsere Fahrer sowie Kunden koordiniert.",
    tasks: [
      "Planung und Steuerung nationaler Transporte",
      "Kommunikation mit Fahrern, Kunden und Partnern",
      "Nutzung unseres digitalen Dispositionssystems",
      "Überwachung von Terminen und Lieferqualität",
    ],
    requirements: [
      "Abgeschlossene Ausbildung als Kaufmann/-frau für Spedition und Logistikdienstleistung",
      "Erste Berufserfahrung in der Disposition wünschenswert",
      "Sicherer Umgang mit Dispositionssoftware",
      "Belastbarkeit und Organisationstalent",
    ],
  },
  {
    slug: "lagerlogistiker",
    title: "Fachkraft für Lagerlogistik (m/w/d)",
    location: "Falkenwalde",
    type: "Vollzeit / Schicht",
    department: "Lager",
    description:
      "Wir suchen Verstärkung für Wareneingang, Kommissionierung und digitale Inventuren in unserem Logistikzentrum.",
    tasks: [
      "Warenannahme, Einlagerung und Kommissionierung",
      "Durchführung digitaler Inventuren",
      "Bedienung von Flurförderzeugen (Staplerschein von Vorteil)",
      "Einhaltung von Qualitäts- und Sicherheitsstandards",
    ],
    requirements: [
      "Abgeschlossene Ausbildung als Fachkraft für Lagerlogistik oder vergleichbar",
      "Staplerschein wünschenswert",
      "Sorgfältige und zuverlässige Arbeitsweise",
      "Bereitschaft zur Schichtarbeit",
    ],
  },
  {
    slug: "kfz-mechatroniker",
    title: "Kfz-Mechatroniker Nutzfahrzeuge (m/w/d)",
    location: "Falkenwalde",
    type: "Vollzeit",
    department: "Werkstatt",
    description: "Für unsere hauseigene Werkstatt suchen wir einen Kfz-Mechatroniker zur Wartung unseres Fuhrparks.",
    tasks: [
      "Wartung und Reparatur von Lkw und Aufliegern",
      "Durchführung von Prüf- und Wartungsterminen",
      "Fehlerdiagnose an modernen Nutzfahrzeugen",
      "Dokumentation in der digitalen Fahrzeugverwaltung",
    ],
    requirements: [
      "Abgeschlossene Ausbildung als Kfz-Mechatroniker, Schwerpunkt Nutzfahrzeugtechnik",
      "Erfahrung mit gängigen Lkw-Marken von Vorteil",
      "Führerschein Klasse C/CE wünschenswert",
      "Selbstständige und lösungsorientierte Arbeitsweise",
    ],
  },
  {
    slug: "azubi-kaufmann-spedition",
    title: "Ausbildung Kaufmann/-frau für Spedition und Logistikdienstleistung",
    location: "Falkenwalde",
    type: "Ausbildung",
    department: "Disposition / Verwaltung",
    description: "Starte deine Karriere in der Logistik mit einer praxisnahen Ausbildung bei Baltic Freight.",
    tasks: [
      "Einblicke in Disposition, Vertrieb und Buchhaltung",
      "Mitarbeit an nationalen und internationalen Transporten",
      "Kennenlernen digitaler Speditionsprozesse",
      "Begleitung durch feste Ausbildungspaten",
    ],
    requirements: [
      "Guter Realschulabschluss oder (Fach-)Abitur",
      "Interesse an Logistik und internationalem Handel",
      "Organisationstalent und Kommunikationsfreude",
      "Gute Deutschkenntnisse, Englisch von Vorteil",
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

export const reviews: Review[] = [
  {
    author: "Michael Rathke",
    company: "Rathke Baustoffe GmbH",
    rating: 5,
    text: "Zuverlässige Termine, transparente Kommunikation und ein Dispositionsteam, das auch bei kurzfristigen Änderungen mitdenkt. Seit Jahren unser Speditionspartner.",
    date: "2026-06-01",
  },
  {
    author: "Anna Kowalska",
    company: "Nordbalt Trading Sp. z o.o.",
    rating: 5,
    text: "Für unsere Transporte ins Baltikum ist Baltic Freight erste Wahl. Grenzformalitäten laufen reibungslos, die Sendungsverfolgung ist top.",
    date: "2026-04-22",
  },
  {
    author: "Sven Ohlerich",
    company: "Küstenlogistik Nord",
    rating: 4,
    text: "Sehr professioneller Auftritt und moderner Fuhrpark. Die Preise liegen leicht über dem Marktdurchschnitt, die Qualität rechtfertigt es aber.",
    date: "2026-03-11",
  },
  {
    author: "Julia Berndt",
    company: "Berndt Frischwaren",
    rating: 5,
    text: "Unsere Kühltransporte sind bei Baltic Freight in besten Händen. Temperaturprotokolle kommen lückenlos und pünktlich.",
    date: "2026-01-27",
  },
];

export type Partner = {
  name: string;
  category: string;
};

export const partners: Partner[] = [
  { name: "Ostsee Cargo Network", category: "Transportnetzwerk" },
  { name: "Baltic Ports Alliance", category: "Hafenlogistik" },
  { name: "NordLog Systems", category: "Software & Telematik" },
  { name: "PolTrans Partner Sp. z o.o.", category: "Kooperationspartner Polen" },
  { name: "Greenline Fuel Services", category: "Kraftstoff & Tankkarten" },
  { name: "AssekuraLog Versicherungen", category: "Transportversicherung" },
];
