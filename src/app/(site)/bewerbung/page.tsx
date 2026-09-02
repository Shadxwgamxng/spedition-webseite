import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Container, Section } from "@/components/ui/primitives";
import { ApplicationForm } from "@/components/site/application-form";
import { CheckIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Bewerbungsportal",
  description: "Bewirb dich online bei der Baltic Freight GmbH – schnell, unkompliziert und digital.",
};

const steps = [
  "Formular ausfüllen und Unterlagen hochladen",
  "Sichtung durch unser Recruiting-Team",
  "Persönliches Kennenlernen (vor Ort oder digital)",
  "Rückmeldung & Vertragsangebot",
];

export default async function BewerbungPage(props: PageProps<"/bewerbung">) {
  const searchParams = await props.searchParams;
  const stelleParam = searchParams?.stelle;
  const initialPosition = Array.isArray(stelleParam) ? stelleParam[0] : stelleParam ?? "";

  return (
    <>
      <PageHero
        eyebrow="Bewerbungsportal"
        title="Bewirb dich in wenigen Minuten"
        description="Egal ob Berufskraftfahrer, Disponent oder Quereinsteiger – wir freuen uns auf deine Bewerbung."
      />

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ApplicationForm initialPosition={initialPosition} />
            </div>
            <aside className="space-y-4">
              <div className="rounded-2xl border border-navy-900/8 bg-white p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">So läuft&apos;s ab</h2>
                <ol className="mt-4 space-y-3">
                  {steps.map((step, i) => (
                    <li key={step} className="flex items-start gap-3 text-sm text-navy-800">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-amber-400">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="rounded-2xl bg-navy-900 p-6 text-white">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                  <CheckIcon className="h-4 w-4" />
                  Gut zu wissen
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Auch ohne aktuelle Stellenausschreibung freuen wir uns über Initiativbewerbungen aus allen
                  Fachbereichen.
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
