import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { TeamPersonCard } from "@/components/site/team-person-card";
import { getTeam } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team",
  description: "Unser gesamtes Team bei der Baltic Freight GmbH.",
};

export default async function TeamPage() {
  const team = await getTeam();
  return (
    <>
      <PageHero
        eyebrow="Team"
        title="Unser Team"
        description="Die Menschen, die bei Baltic Freight jeden Tag den Betrieb am Laufen halten."
      />

      <Section>
        <Container>
          <SectionHeading eyebrow="Baltic Freight GmbH" title="Alle Mitarbeiterinnen und Mitarbeiter" />
          {team.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((person) => (
                <TeamPersonCard key={person.id} person={person} collection="team" />
              ))}
            </div>
          ) : (
            <p className="mt-10 text-sm text-navy-700/60">Noch keine Team-Mitglieder hinterlegt.</p>
          )}
        </Container>
      </Section>
    </>
  );
}
