import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section } from "@/components/ui/primitives";
import { OrderForm } from "@/components/site/order-form";
import { ClockIcon, MailIcon, PhoneIcon } from "@/components/ui/icons";
import { getCompany } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Auftrag einreichen",
  description: "Reichen Sie Ihren Transportauftrag direkt online bei der Disposition der Baltic Freight GmbH ein.",
};

export default async function AuftragPage() {
  const company = await getCompany();
  return (
    <>
      <PageHero
        eyebrow="Auftrag einreichen"
        title="Ihren Transportauftrag online einreichen"
        description="Füllen Sie das Formular aus – unsere Disposition prüft Ihre Anfrage und meldet sich zeitnah mit einem Angebot bzw. der Auftragsbestätigung."
      />

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <OrderForm />
            </div>
            <aside className="space-y-4">
              <div className="rounded-2xl border border-navy-900/8 bg-white p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Lieber persönlich?</h2>
                <p className="mt-3 text-sm leading-relaxed text-navy-700/75">
                  Unsere Disposition ist während der Geschäftszeiten auch telefonisch für Sie erreichbar.
                </p>
                <ul className="mt-4 space-y-3 text-sm text-navy-800">
                  {company.phone ? (
                    <li className="flex items-center gap-2.5">
                      <PhoneIcon className="h-4 w-4 shrink-0 text-amber-600" />
                      <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="hover:text-amber-700">
                        {company.phone}
                      </a>
                    </li>
                  ) : null}
                  {company.disposition_email ? (
                    <li className="flex items-center gap-2.5">
                      <MailIcon className="h-4 w-4 shrink-0 text-amber-600" />
                      <a href={`mailto:${company.disposition_email}`} className="hover:text-amber-700">
                        {company.disposition_email}
                      </a>
                    </li>
                  ) : null}
                  <li className="flex items-center gap-2.5">
                    <ClockIcon className="h-4 w-4 shrink-0 text-amber-600" />
                    Mo–Fr 06:00–20:00 Uhr
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
