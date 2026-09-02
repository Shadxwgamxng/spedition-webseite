import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Button, Card, Container, Section } from "@/components/ui/primitives";
import {
  CheckIcon,
  ClockIcon,
  GlobeIcon,
  RouteIcon,
  ShieldIcon,
  TruckIcon,
  WarehouseIcon,
} from "@/components/ui/icons";
import { getServices } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsere Leistungen",
  description: "Nationale und internationale Transporte, Lagerlogistik, Disposition, Gefahrgut und Express-Verkehre.",
};

const serviceIcons = {
  truck: TruckIcon,
  warehouse: WarehouseIcon,
  route: RouteIcon,
  globe: GlobeIcon,
  shield: ShieldIcon,
  clock: ClockIcon,
};

export default async function LeistungenPage() {
  const services = await getServices();
  return (
    <>
      <PageHero
        eyebrow="Unsere Leistungen"
        title="Logistiklösungen für jede Anforderung"
        description="Von der klassischen Komplettladung bis zur digitalen Kontraktlogistik – wir kombinieren Transport, Lager und Disposition zu einer Lösung."
      >
        <div className="mt-8">
          <Button href="/auftrag">Auftrag einreichen</Button>
        </div>
      </PageHero>

      <Section>
        <Container>
          <div className="space-y-16">
            {services.map((service, index) => {
              const Icon = serviceIcons[service.icon];
              return (
                <div
                  key={service.slug}
                  id={service.slug}
                  className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 ${
                    index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-amber-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="mt-5 text-2xl font-bold text-navy-900 sm:text-3xl">{service.title}</h2>
                    <p className="mt-4 text-base leading-relaxed text-navy-700/80">{service.description}</p>
                    <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {service.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-sm text-navy-800">
                          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Card className="bg-navy-900 text-white">
                    <Icon className="h-10 w-10 text-amber-400" />
                    <p className="mt-4 text-lg font-medium leading-relaxed text-white/90">{service.short}</p>
                  </Card>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="bg-amber-400">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-navy-950 sm:text-3xl">Welche Leistung passt zu Ihrem Bedarf?</h2>
              <p className="mt-2 max-w-xl text-navy-950/70">
                Unsere Disposition berät Sie persönlich und findet die passende Lösung für Ihre Sendung.
              </p>
            </div>
            <Button href="/standort" variant="secondary">
              Disposition kontaktieren
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
