import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Badge, Button, Container, Section, SectionHeading } from "@/components/ui/primitives";
import { ArrowRightIcon, MapPinIcon } from "@/components/ui/icons";
import { getJobs } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stellenangebote",
  description: "Offene Stellen bei Baltic Freight GmbH in Falkenwalde – Fahrer, Disposition, Lager, Werkstatt und Ausbildung.",
};

export default async function KarrierePage() {
  const jobs = await getJobs();
  return (
    <>
      <PageHero
        eyebrow="Karriere"
        title="Werde Teil von Baltic Freight"
        description="Wir wachsen weiter und suchen engagierte Kolleginnen und Kollegen für Fahrbetrieb, Disposition, Lager, Werkstatt und Verwaltung."
      >
        <div className="mt-8">
          <Button href="/bewerbung">Initiativbewerbung senden</Button>
        </div>
      </PageHero>

      <Section>
        <Container>
          <SectionHeading eyebrow="Offene Stellen" title={`${jobs.length} aktuelle Stellenangebote`} />
          <div className="mt-10 space-y-4">
            {jobs.map((job) => (
              <Link
                key={job.slug}
                href={`/karriere/${job.slug}`}
                className="group flex flex-col gap-3 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5 transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-navy-900 group-hover:text-amber-700">{job.title}</h3>
                    <Badge>{job.department}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-navy-700/70">
                    <span className="flex items-center gap-1.5">
                      <MapPinIcon className="h-4 w-4" />
                      {job.location}
                    </span>
                    <span>{job.type}</span>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-amber-600">
                  Details ansehen <ArrowRightIcon className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-amber-400">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-navy-950 sm:text-3xl">Nichts Passendes dabei?</h2>
              <p className="mt-2 max-w-xl text-navy-950/70">
                Wir freuen uns auch über Initiativbewerbungen – schick uns einfach deine Unterlagen.
              </p>
            </div>
            <Button href="/bewerbung" variant="secondary">
              Zum Bewerbungsportal
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
