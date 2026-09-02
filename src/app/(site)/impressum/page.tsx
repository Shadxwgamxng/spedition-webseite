import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section } from "@/components/ui/primitives";
import { company } from "@/lib/data";

export const metadata: Metadata = {
  title: "Impressum",
};

export default function ImpressumPage() {
  return (
    <>
      <PageHero eyebrow="Rechtliches" title="Impressum" />
      <Section>
        <Container>
          <div className="prose-sm max-w-2xl space-y-6 text-sm leading-relaxed text-navy-800">
            <div>
              <h2 className="text-base font-semibold text-navy-900">Angaben gemäß § 5 TMG</h2>
              <p className="mt-2">
                {company.name}
                <br />
                {company.street}
                <br />
                {company.zip} {company.city}
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy-900">Vertreten durch</h2>
              <p className="mt-2">Geschäftsführung: Torsten Wegner, Kristina Bahlke</p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy-900">Kontakt</h2>
              <p className="mt-2">
                Telefon: {company.phone}
                <br />
                Telefax: {company.fax}
                <br />
                E-Mail: {company.email}
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy-900">Registereintrag</h2>
              <p className="mt-2">
                Eintragung im Handelsregister.
                <br />
                Registergericht: Amtsgericht Neubrandenburg
                <br />
                Registernummer: HRB [Platzhalter]
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy-900">Umsatzsteuer-ID</h2>
              <p className="mt-2">
                Umsatzsteuer-Identifikationsnummer gemäß §27a Umsatzsteuergesetz: DE [Platzhalter]
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy-900">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <p className="mt-2">
                Torsten Wegner
                <br />
                {company.street}, {company.zip} {company.city}
              </p>
            </div>
            <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-xs text-navy-700/70">
              Hinweis: Diese Seite enthält Platzhalterangaben (z. B. Handelsregisternummer, USt-ID) und ersetzt keine
              rechtliche Prüfung. Bitte vor Veröffentlichung durch die tatsächlichen Unternehmensdaten ersetzen und
              rechtlich prüfen lassen.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
