import {
  ChartIcon,
  ClipboardIcon,
  IdCardIcon,
  InvoiceIcon,
  RouteIcon,
  TruckIcon,
  WarehouseIcon,
} from "@/components/ui/icons";

export const employeeModules = [
  {
    href: "/mitarbeiter/disposition",
    label: "Disposition",
    description: "Touren planen, Fahrer & Fahrzeuge zuweisen.",
    icon: RouteIcon,
  },
  {
    href: "/mitarbeiter/lager",
    label: "Lagerverwaltung & Inventuren",
    description: "Bestände, Wareneingänge und digitale Inventuren.",
    icon: WarehouseIcon,
  },
  {
    href: "/mitarbeiter/fahrzeuge",
    label: "Fahrzeugverwaltung",
    description: "Fuhrpark, Wartungen und Prüftermine im Überblick.",
    icon: TruckIcon,
  },
  {
    href: "/mitarbeiter/fahrtenbuch",
    label: "Digitales Fahrtenbuch",
    description: "Fahrten erfassen und Kilometerstände dokumentieren.",
    icon: ClipboardIcon,
  },
  {
    href: "/mitarbeiter/fahrerkarte",
    label: "Digitale Fahrerkarte",
    description: "Lenk- und Ruhezeiten je Fahrer im Blick.",
    icon: IdCardIcon,
  },
  {
    href: "/mitarbeiter/rechnungen",
    label: "Rechnungserstellung",
    description: "Rechnungen direkt erstellen und verwalten.",
    icon: InvoiceIcon,
  },
  {
    href: "/mitarbeiter/finanzen",
    label: "Finanzbuchhaltung",
    description: "Buchungen, offene Posten und Reporting.",
    icon: ChartIcon,
  },
] as const;
