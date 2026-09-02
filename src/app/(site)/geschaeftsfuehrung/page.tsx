import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Card, Container, Section, SectionHeading } from "@/components/ui/primitives";
import { company, keyPositions, management } from "@/lib/data";
import { MailIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Geschäftsführung",
  description: "Die Geschäftsführung und wichtige Positionen der Baltic Freight GmbH.",
};

function PersonCard({ person }: { person: (typeof management)[number] }) {
  return (
    <Card className="flex flex-col items-start">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900 text-lg font-bold text-amber-400">
        {person.initials}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-navy-900">{person.name}</h3>
      <div className="text-sm font-medium text-amber-600">{person.role}</div>
      <div className="mt-0.5 text-xs uppercase tracking-wide text-navy-700/50">{person.department}</div>
      <p className="mt-3 text-sm leading-relaxed text-navy-700/75">{person.bio}</p>
    </Card>
  );
}

export default function GeschaeftsfuehrungPage() {
  return (
    <>
      <PageHero
        eyebrow="Geschäftsführung"
        title="Die Menschen hinter Baltic Freight"
        description="Unsere Geschäftsführung und die Leitungen der Fachbereiche sorgen jeden Tag dafür, dass Ihre Sendungen sicher ankommen."
      />

      <Section>
        <Container>
          <SectionHeading eyebrow="Geschäftsleitung" title="Geschäftsführung" />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {management.map((person) => (
              <PersonCard key={person.name} person={person} />
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-mist-100">
        <Container>
          <SectionHeading
            eyebrow="Führungsteam"
            title="Wichtige Positionen im Unternehmen"
            description="Von der Disposition über das Lager bis zur Buchhaltung – unsere Abteilungsleitungen im Überblick."
          />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {keyPositions.map((person) => (
              <PersonCard key={person.name} person={person} />
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="flex flex-col items-start gap-6 rounded-3xl border border-navy-900/8 bg-white p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h2 className="text-xl font-bold text-navy-900">Sie möchten unsere Geschäftsführung erreichen?</h2>
              <p className="mt-2 text-sm text-navy-700/70">
                Für allgemeine Anfragen wenden Sie sich gerne direkt an unser Team.
              </p>
            </div>
            <a
              href={`mailto:${company.email}`}
              className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
            >
              <MailIcon className="h-4 w-4" />
              {company.email}
            </a>
          </div>
        </Container>
      </Section>
    </>
  );
}
