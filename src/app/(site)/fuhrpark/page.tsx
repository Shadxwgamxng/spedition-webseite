import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Button, Card, Container, Section, SectionHeading } from "@/components/ui/primitives";
import { CheckIcon, GaugeIcon, TruckIcon } from "@/components/ui/icons";
import { getFleetCategories } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fuhrpark",
  description: "Unser moderner Fuhrpark: Sattelzugmaschinen, Kühlauflieger und flexible Solofahrzeuge.",
};

export default async function FuhrparkPage() {
  const fleet = await getFleetCategories();
  const totalVehicles = fleet.reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <PageHero
        eyebrow="Fuhrpark"
        title="Ein Fuhrpark, der mitdenkt"
        description={`${totalVehicles}+ Fahrzeuge – von der Sattelzugmaschine bis zum Kühlauflieger. Regelmäßig gewartet, modern ausgestattet und digital vernetzt.`}
      />

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {fleet.map((item) => (
              <Card key={item.id} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-amber-400">
                    <TruckIcon className="h-5 w-5" />
                  </div>
                  <span className="text-3xl font-bold text-navy-900">{item.count}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy-900">{item.category}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-700/70">{item.description}</p>
                <ul className="mt-4 space-y-2">
                  {item.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-navy-800">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      {f}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-navy-900 text-white">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading eyebrow="Fuhrparkmanagement" title="Digital verwaltet, immer einsatzbereit" />
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                Unsere interne Fahrzeugverwaltung dokumentiert Wartungen, Prüftermine und Laufleistungen jedes
                Fahrzeugs. So stellen wir sicher, dass unsere Flotte jederzeit sicher und einsatzbereit ist.
              </p>
              <div className="mt-6">
                <Button href="/mitarbeiter/fahrzeuge" variant="primary">
                  Zur Fahrzeugverwaltung (Mitarbeiter)
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Ø Fahrzeugalter", value: "2,6 Jahre" },
                { label: "Wartungsintervall", value: "vollständig dokumentiert" },
                { label: "Telematik", value: "in allen Zugmaschinen" },
                { label: "Verfügbarkeit", value: "24/7 Werkstattbereitschaft" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <GaugeIcon className="h-5 w-5 text-amber-400" />
                  <div className="mt-3 text-sm font-semibold">{item.value}</div>
                  <div className="text-xs text-white/50">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
