import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Card, Container, Section, SectionHeading } from "@/components/ui/primitives";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { getCompany } from "@/lib/server/store";
import { ContactForm } from "@/components/site/contact-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompany();
  return {
    title: "Standort",
    description: `Besuchen Sie uns in ${company.street}, ${company.zip} ${company.city} oder kontaktieren Sie unsere Disposition.`,
  };
}

const hours = [
  { day: "Montag – Freitag", time: "06:00 – 20:00 Uhr" },
  { day: "Samstag", time: "07:00 – 14:00 Uhr (Disposition Notdienst)" },
  { day: "Sonn- & Feiertag", time: "geschlossen" },
];

const mapSrc =
  "https://www.openstreetmap.org/export/embed.html?bbox=14.13%2C53.35%2C14.27%2C53.42&layer=mapnik&marker=53.385%2C14.2";

export default async function StandortPage() {
  const company = await getCompany();
  return (
    <>
      <PageHero
        eyebrow="Standort"
        title="Unser Logistikzentrum in Falkenwalde"
        description="Zentral im Ostseeraum gelegen, nahe der deutsch-polnischen Grenze – ideal für nationale und internationale Verkehre."
      />

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="flex items-start gap-3">
                  <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <div className="text-sm font-semibold text-navy-900">Adresse</div>
                    <div className="mt-1 text-sm text-navy-700/75">
                      {company.street}
                      <br />
                      {company.zip} {company.city}
                      <br />
                      Deutschland
                    </div>
                  </div>
                </div>
              </Card>
              {company.phone ? (
                <Card>
                  <div className="flex items-start gap-3">
                    <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <div className="text-sm font-semibold text-navy-900">Telefon</div>
                      <div className="mt-1 text-sm text-navy-700/75">{company.phone}</div>
                    </div>
                  </div>
                </Card>
              ) : null}
              {company.email || company.disposition_email || company.karriere_email ? (
                <Card>
                  <div className="flex items-start gap-3">
                    <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <div className="text-sm font-semibold text-navy-900">E-Mail</div>
                      <div className="mt-1 space-y-0.5 text-sm text-navy-700/75">
                        {company.email ? <div>Allgemein: {company.email}</div> : null}
                        {company.disposition_email ? <div>Disposition: {company.disposition_email}</div> : null}
                        {company.karriere_email ? <div>Karriere: {company.karriere_email}</div> : null}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : null}
              <Card>
                <div className="flex items-start gap-3">
                  <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <div className="text-sm font-semibold text-navy-900">Erreichbarkeit</div>
                    <ul className="mt-1 space-y-0.5 text-sm text-navy-700/75">
                      {hours.map((h) => (
                        <li key={h.day} className="flex justify-between gap-4">
                          <span>{h.day}</span>
                          <span className="font-medium text-navy-800">{h.time}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <div className="overflow-hidden rounded-2xl border border-navy-900/8 shadow-sm shadow-navy-950/5">
                <iframe
                  title="Standort Baltic Freight GmbH, Falkenwalde"
                  src={mapSrc}
                  className="h-80 w-full sm:h-96"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-mist-100">
        <Container>
          <SectionHeading eyebrow="Kontakt" title="Schreiben Sie uns" description="Wir melden uns in der Regel innerhalb eines Werktags zurück." />
          <div className="mt-10 max-w-2xl">
            <ContactForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
