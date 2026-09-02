import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Button, Card, Container, Section, SectionHeading } from "@/components/ui/primitives";
import { getPartners } from "@/lib/server/store";
import { GlobeIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partner",
  description: "Unsere Netzwerk- und Kooperationspartner im Ostseeraum.",
};

export default async function PartnerPage() {
  const partners = await getPartners();
  return (
    <>
      <PageHero
        eyebrow="Partner"
        title="Gemeinsam stark im Ostseeraum"
        description="Baltic Freight arbeitet mit ausgewählten Netzwerk- und Kooperationspartnern zusammen, um Ihnen durchgängige Logistiklösungen zu bieten."
      />

      <Section>
        <Container>
          <SectionHeading eyebrow="Unsere Partner" title="Netzwerk- und Kooperationspartner" />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <Card key={partner.id} className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-amber-400">
                  <GlobeIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-navy-900">{partner.name}</div>
                  <div className="mt-1 text-sm text-navy-700/60">{partner.category}</div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-navy-900 text-white">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Partner werden?</h2>
            <p className="mt-2 max-w-xl text-white/70">
              Sie möchten mit Baltic Freight kooperieren? Wir freuen uns über den Austausch mit neuen
              Netzwerkpartnern.
            </p>
          </div>
          <Button href="/standort">Kontakt aufnehmen</Button>
        </Container>
      </Section>
    </>
  );
}
