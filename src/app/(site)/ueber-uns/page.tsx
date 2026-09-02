import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Button, Card, Container, Section, SectionHeading } from "@/components/ui/primitives";
import { CheckIcon, ClockIcon, GlobeIcon, ShieldIcon, TruckIcon, UsersIcon } from "@/components/ui/icons";
import { company } from "@/lib/data";

export const metadata: Metadata = {
  title: "Über uns",
  description: "Geschichte, Werte und Zahlen der Baltic Freight GmbH aus Falkenwalde.",
};

const milestones = [
  { year: "2007", text: "Gründung der Baltic Freight GmbH in Falkenwalde mit fünf Fahrzeugen." },
  { year: "2012", text: "Aufbau des ersten Logistikzentrums mit 4.000 m² Lagerfläche." },
  { year: "2016", text: "Ausweitung der internationalen Verkehre in den Baltikum- und Skandinavienraum." },
  { year: "2020", text: "Einführung der digitalen Disposition und des Kundenportals." },
  { year: "2023", text: "Erweiterung des Fuhrparks auf über 90 Fahrzeuge und Auflieger." },
  { year: "2026", text: "Ausbau des Logistikzentrums auf über 12.000 m² Lagerfläche." },
];

const values = [
  { icon: ShieldIcon, title: "Zuverlässigkeit", text: "Termintreue und Ehrlichkeit sind die Basis jeder Zusammenarbeit." },
  { icon: TruckIcon, title: "Moderne Flotte", text: "Wir investieren kontinuierlich in neue, effiziente Fahrzeuge." },
  { icon: GlobeIcon, title: "Regionale Wurzeln, europäische Reichweite", text: "Fest verwurzelt in Falkenwalde, unterwegs im gesamten Ostseeraum." },
  { icon: UsersIcon, title: "Starkes Team", text: "Über 120 Mitarbeitende, die täglich für unsere Kunden im Einsatz sind." },
];

export default function UeberUnsPage() {
  return (
    <>
      <PageHero
        eyebrow="Über uns"
        title="Familienunternehmen mit Blick auf die Ostsee"
        description={`Seit ${company.founded} sind wir als inhabergeführte Spedition in Falkenwalde für unsere Kunden im Einsatz – heute mit über 120 Mitarbeitenden und einem modernen Fuhrpark.`}
      />

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeading
                eyebrow="Unsere Geschichte"
                title="Aus Falkenwalde in den Ostseeraum"
                description="Was 2007 als kleiner regionaler Fuhrbetrieb begann, ist heute eine leistungsstarke Spedition mit eigenem Logistikzentrum und internationalen Verkehren."
              />
              <p className="mt-4 text-sm leading-relaxed text-navy-700/75">
                Durch unsere Lage nahe der deutsch-polnischen Grenze sind wir prädestiniert für Transporte in den
                Ostsee- und Baltikumraum – ohne dabei unsere Wurzeln im nationalen Verkehr zu vernachlässigen.
              </p>
              <div className="mt-6">
                <Button href="/geschaeftsfuehrung" variant="outline">
                  Geschäftsführung &amp; Team
                </Button>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-navy-900 p-8 text-white">
              <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
              <ol className="relative space-y-6">
                {milestones.map((m) => (
                  <li key={m.year} className="flex gap-4">
                    <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-sm font-bold text-navy-950">
                      {m.year}
                    </span>
                    <p className="text-sm leading-relaxed text-white/80">{m.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-mist-100">
        <Container>
          <SectionHeading eyebrow="Unsere Werte" title="Worauf wir bei Baltic Freight bauen" align="center" />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <Card key={value.title}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-amber-400">
                  <value.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-navy-900">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-700/70">{value.text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-6 rounded-3xl border border-navy-900/8 bg-white p-8 sm:grid-cols-3 sm:p-10">
            {[
              { icon: ClockIcon, title: "Rund um die Uhr erreichbar", text: "Unsere Disposition ist für Sie und unsere Fahrer durchgehend erreichbar." },
              { icon: CheckIcon, title: "Zertifizierte Qualität", text: "Regelmäßige Schulungen und geprüfte Prozesse sichern gleichbleibende Qualität." },
              { icon: UsersIcon, title: "Ausbildungsbetrieb", text: "Wir bilden jährlich in mehreren Berufsbildern aus und fördern Nachwuchskräfte." },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-start gap-3">
                <item.icon className="h-6 w-6 text-amber-600" />
                <h3 className="text-base font-semibold text-navy-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-navy-700/70">{item.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-navy-900 text-white">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Lernen Sie unser Führungsteam kennen</h2>
            <p className="mt-2 max-w-xl text-white/70">
              Geschäftsführung, Abteilungsleitungen und die Menschen hinter Baltic Freight.
            </p>
          </div>
          <Button href="/geschaeftsfuehrung" icon={false}>
            Zum Team
          </Button>
        </Container>
      </Section>
    </>
  );
}
