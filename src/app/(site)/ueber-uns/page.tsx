import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Button, Card, Container, Section, SectionHeading } from "@/components/ui/primitives";
import {
  CheckIcon,
  ClockIcon,
  GlobeIcon,
  RouteIcon,
  ShieldIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
} from "@/components/ui/icons";
import { getAboutHighlights, getAboutMilestones, getAboutPage, getAboutValues, getCompany } from "@/lib/server/store";
import type { AboutIconKey } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Über uns",
  description: "Geschichte, Werte und Zahlen der Baltic Freight GmbH aus Falkenwalde.",
};

const aboutIcons: Record<AboutIconKey, typeof ShieldIcon> = {
  shield: ShieldIcon,
  truck: TruckIcon,
  globe: GlobeIcon,
  users: UsersIcon,
  clock: ClockIcon,
  check: CheckIcon,
  warehouse: WarehouseIcon,
  route: RouteIcon,
};

function iconFor(key: string) {
  return aboutIcons[key as AboutIconKey] ?? ShieldIcon;
}

export default async function UeberUnsPage() {
  const [company, about, milestones, values, highlights] = await Promise.all([
    getCompany(),
    getAboutPage(),
    getAboutMilestones(),
    getAboutValues(),
    getAboutHighlights(),
  ]);
  const heroDescription = about.heroDescription.replaceAll("{founded}", String(company.founded));

  return (
    <>
      <PageHero eyebrow={about.heroEyebrow} title={about.heroTitle} description={heroDescription} />

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeading
                eyebrow={about.storyEyebrow}
                title={about.storyTitle}
                description={about.storyDescription}
              />
              <p className="mt-4 text-sm leading-relaxed text-navy-700/75">{about.storyParagraph}</p>
              <div className="mt-6">
                <Button href="/geschaeftsfuehrung" variant="outline">
                  Geschäftsführung &amp; Team
                </Button>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-navy-900 p-8 text-white">
              <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
              <ol className="relative space-y-6">
                {milestones.map((m) => (
                  <li key={m.id} className="flex gap-4">
                    <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-sm font-bold text-navy-950">
                      {m.year}
                    </span>
                    <p className="text-sm leading-relaxed text-white/80">{m.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-mist-100">
        <Container>
          <SectionHeading eyebrow={about.valuesEyebrow} title={about.valuesTitle} align="center" />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = iconFor(value.icon);
              return (
                <Card key={value.id}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-amber-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-navy-900">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-700/70">{value.text}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-6 rounded-3xl border border-navy-900/8 bg-white p-8 sm:grid-cols-3 sm:p-10">
            {highlights.map((item) => {
              const Icon = iconFor(item.icon);
              return (
                <div key={item.id} className="flex flex-col items-start gap-3">
                  <Icon className="h-6 w-6 text-amber-600" />
                  <h3 className="text-base font-semibold text-navy-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-navy-700/70">{item.text}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="bg-navy-900 text-white">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{about.ctaTitle}</h2>
            <p className="mt-2 max-w-xl text-white/70">{about.ctaText}</p>
          </div>
          <Button href="/geschaeftsfuehrung" icon={false}>
            Zum Team
          </Button>
        </Container>
      </Section>
    </>
  );
}
