import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { navLinks } from "@/lib/data";
import { getCompany } from "@/lib/server/store";
import { MailIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";

const employeeLinks = [
  { href: "/mitarbeiter/login", label: "Mitarbeiter Login" },
  { href: "/mitarbeiter/disposition", label: "Disposition" },
  { href: "/mitarbeiter/lager", label: "Lagerverwaltung" },
  { href: "/mitarbeiter/fahrzeuge", label: "Fahrzeugverwaltung" },
  { href: "/mitarbeiter/fahrtenbuch", label: "Digitales Fahrtenbuch" },
  { href: "/mitarbeiter/rechnungen", label: "Rechnungserstellung" },
];

const serviceLinks = [
  { href: "/leistungen", label: "Unsere Leistungen" },
  { href: "/auftrag", label: "Auftrag einreichen" },
  { href: "/karriere", label: "Stellenangebote" },
  { href: "/bewerbung", label: "Bewerbungsportal" },
  { href: "/rezensionen", label: "Rezensionen" },
  { href: "/partner", label: "Partner" },
];

export async function Footer() {
  const company = await getCompany();
  return (
    <footer className="bg-navy-950 text-white">
      <div className="container-page grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            Baltic Freight GmbH ist Ihre Spedition für nationale und internationale Transporte, Lagerlogistik und
            digitale Disposition mit Sitz in Falkenwalde.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-white/70">
            <li className="flex items-start gap-2.5">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              {company.street}, {company.zip} {company.city}
            </li>
            <li className="flex items-center gap-2.5">
              <PhoneIcon className="h-4 w-4 shrink-0 text-amber-400" />
              <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="hover:text-white">
                {company.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MailIcon className="h-4 w-4 shrink-0 text-amber-400" />
              <a href={`mailto:${company.email}`} className="hover:text-white">
                {company.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Unternehmen</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Service</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            {serviceLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Mitarbeiterbereich</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            {employeeLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Baltic Freight GmbH, Falkenwalde. Alle Rechte vorbehalten.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/impressum" className="hover:text-white">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-white">
              Datenschutz
            </Link>
            <Link href="/standort" className="hover:text-white">
              Standort
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
