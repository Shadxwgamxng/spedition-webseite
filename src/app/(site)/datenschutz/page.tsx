import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section } from "@/components/ui/primitives";
import { getCompany } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Datenschutz",
};

export default async function DatenschutzPage() {
  const company = await getCompany();
  return (
    <>
      <PageHero eyebrow="Rechtliches" title="Datenschutzerklärung" />
      <Section>
        <Container>
          <div className="max-w-2xl space-y-8 text-sm leading-relaxed text-navy-800">
            <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-xs text-navy-700/70">
              Hinweis: Diese Datenschutzerklärung ist eine allgemeine Vorlage und muss vor Veröffentlichung an die
              tatsächlich eingesetzten Dienste (z. B. Hosting, Analyse-Tools, Bewerbungsmanagement) angepasst und
              rechtlich geprüft werden.
            </p>

            <div>
              <h2 className="text-base font-semibold text-navy-900">1. Verantwortlicher</h2>
              <p className="mt-2">
                {company.name}, {company.street}, {company.zip} {company.city}, E-Mail: {company.email}
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-navy-900">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
              <p className="mt-2">
                Wir verarbeiten personenbezogene Daten, die Sie uns im Rahmen von Auftrags-, Kontakt- oder
                Bewerbungsformularen mitteilen (z. B. Name, Kontaktdaten, Angaben zur Sendung, Bewerbungsunterlagen),
                ausschließlich zur Bearbeitung Ihrer Anfrage und im Rahmen der Vertragsanbahnung bzw. -erfüllung.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-navy-900">3. Rechtsgrundlage</h2>
              <p className="mt-2">
                Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung bzw.
                vorvertragliche Maßnahmen) sowie ggf. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-navy-900">4. Mitarbeiterbereich</h2>
              <p className="mt-2">
                Der passwortgeschützte Mitarbeiterbereich dient internen Zwecken (u. a. Disposition,
                Fahrzeugverwaltung, Rechnungsstellung). Zugangsdaten werden ausschließlich an autorisierte
                Mitarbeitende ausgegeben.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-navy-900">5. Speicherdauer</h2>
              <p className="mt-2">
                Personenbezogene Daten werden nur so lange gespeichert, wie es für die Erfüllung des jeweiligen
                Zwecks erforderlich ist bzw. gesetzliche Aufbewahrungsfristen dies vorsehen.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-navy-900">6. Ihre Rechte</h2>
              <p className="mt-2">
                Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
                Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten. Wenden
                Sie sich hierzu an {company.email}.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold text-navy-900">7. Beschwerderecht</h2>
              <p className="mt-2">
                Ihnen steht zudem ein Beschwerderecht bei der zuständigen Datenschutzaufsichtsbehörde zu.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
