import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section } from "@/components/ui/primitives";
import { legalContact } from "@/lib/data";

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
                {legalContact.name}
                <br />
                {legalContact.street}
                <br />
                {legalContact.zip} {legalContact.city}
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy-900">Kontakt</h2>
              <p className="mt-2">
                Telefon: {legalContact.phone}
                <br />
                E-Mail: {legalContact.email}
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy-900">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
              <p className="mt-2">
                {legalContact.name}
                <br />
                {legalContact.street}, {legalContact.zip} {legalContact.city}
              </p>
            </div>
            <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-xs text-navy-700/70">
              Hinweis: Diese Website stellt ein privates, nicht-kommerzielles Projekt dar. &bdquo;Baltic Freight
              GmbH&ldquo; ist keine real existierende, im Handelsregister eingetragene Gesellschaft, sondern eine
              fiktive Bezeichnung im Rahmen dieses Projekts. Verantwortlich für den Betrieb dieser Website ist
              ausschließlich die oben genannte natürliche Person.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
