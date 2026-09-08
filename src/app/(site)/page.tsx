import Link from "next/link";
import { Button, Card, Container, Eyebrow, Section, SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { RouteIllustration } from "@/components/site/route-illustration";
import { WaveDivider } from "@/components/site/wave-divider";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  GlobeIcon,
  RouteIcon,
  ShieldIcon,
  StarIcon,
  TruckIcon,
  WarehouseIcon,
} from "@/components/ui/icons";
import { getFleetCategories, getJobs, getNews, getPartners, getReviews, getServices } from "@/lib/server/store";

export const dynamic = "force-dynamic";

const serviceIcons = {
  truck: TruckIcon,
  warehouse: WarehouseIcon,
  route: RouteIcon,
  globe: GlobeIcon,
  shield: ShieldIcon,
  clock: ClockIcon,
};

const stats = [
  { value: "Seit 2007", label: "Am Start im Ostseeraum" },
  { value: "Falkenwalde", label: "Unser Standort" },
  { value: "National & International", label: "Einsatzgebiet" },
  { value: "Persönlich", label: "Direkter Draht zur Disposition" },
];

export default async function HomePage() {
  const [fleet, jobs, news, partners, reviews, services] = await Promise.all([
    getFleetCategories(),
    getJobs(),
    getNews(),
    getPartners(),
    getReviews(),
    getServices(),
  ]);
  const totalVehicles = fleet.reduce((sum, item) => sum + item.count, 0);
  const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-40 top-1/2 h-[36rem] w-[36rem] -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-[24rem] w-[24rem] rounded-full bg-teal-500/10 blur-3xl" />
        <Container className="relative py-24 sm:py-32">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl">
              <Eyebrow>Spedition &amp; Logistik seit 2007</Eyebrow>
              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
                Ihre Ladung. Unsere Route.
                <span className="block text-amber-400">Zuverlässig im Ostseeraum unterwegs.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
                Baltic Freight GmbH aus Falkenwalde verbindet nationale und internationale Transporte, moderne
                Lagerlogistik und eine volldigitale Disposition – termintreu, transparent und persönlich.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/auftrag">Auftrag einreichen</Button>
                <Button href="/leistungen" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Unsere Leistungen
                </Button>
              </div>
            </div>

            <div className="hidden h-96 lg:block">
              <RouteIllustration className="h-full w-full text-white" />
            </div>
          </div>

          <dl className="mt-16 grid grid-cols-2 gap-6 border-t border-white/10 pt-10 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-2xl font-bold text-amber-400 sm:text-3xl">
                  <AnimatedNumber value={stat.value} />
                </dt>
                <dd className="mt-1 text-sm text-white/60">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </Container>
        <WaveDivider fillClassName="fill-mist-50" />
      </section>

      {/* Services */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Unsere Leistungen"
              title="Logistik aus einer Hand"
              description="Von der Einzelpalette bis zur Kontraktlogistik – wir planen, transportieren und lagern Ihre Waren zuverlässig."
            />
          </Reveal>
          <Reveal delayMs={100}>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => {
                const Icon = serviceIcons[service.icon];
                return (
                  <Card key={service.slug} className="flex flex-col">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-amber-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-navy-900">{service.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-navy-700/75">{service.short}</p>
                    <Link
                      href="/leistungen"
                      className="group/link mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700"
                    >
                      Mehr erfahren{" "}
                      <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-0.5" />
                    </Link>
                  </Card>
                );
              })}
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Digitalisierung / Disposition */}
      <Section className="bg-navy-900 text-white">
        <Container>
          <Reveal>
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div>
                <Eyebrow>Digitale Disposition</Eyebrow>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Volle Transparenz, in Echtzeit.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/70">
                  Unsere hauseigenen Systeme für Disposition, digitales Fahrtenbuch, Fahrzeugverwaltung und
                  Rechnungsstellung sorgen dafür, dass jede Tour effizient geplant und lückenlos dokumentiert wird.
                  Fahrer melden sich beim Schichtstart auf ihr Fahrzeug an – die Disposition sieht das sofort.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/80">
                  {[
                    "Echtzeit-Tourenplanung im Dispositionssystem",
                    "Fahrer-Login direkt auf das Fahrzeug",
                    "Digitales Fahrtenbuch & digitale Fahrerkarte",
                    "Rechnungserstellung direkt im System",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button href="/mitarbeiter/login" variant="primary">
                    Zum Mitarbeiterbereich
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Disposition", icon: RouteIcon },
                  { label: "Lagerverwaltung", icon: WarehouseIcon },
                  { label: "Fahrzeugverwaltung", icon: TruckIcon },
                  { label: "Rechnungserstellung", icon: ShieldIcon },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:bg-white/10"
                  >
                    <item.icon className="h-6 w-6 text-amber-400" />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Fleet teaser */}
      {fleet.length > 0 ? (
        <Section>
          <Container>
            <Reveal>
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <SectionHeading
                  eyebrow="Fuhrpark"
                  title={`${totalVehicles}+ Fahrzeuge für jeden Bedarf`}
                  description="Moderne Sattelzugmaschinen, Kühl- und Standardauflieger sowie flexible Solofahrzeuge für Nah- und Fernverkehr."
                />
                <Button href="/fuhrpark" variant="outline" className="shrink-0">
                  Fuhrpark ansehen
                </Button>
              </div>
            </Reveal>
            <Reveal delayMs={100}>
              <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {fleet.map((item) => (
                  <Card key={item.category}>
                    <div className="text-3xl font-bold text-navy-900">
                      <AnimatedNumber value={String(item.count)} />
                    </div>
                    <div className="mt-1 text-sm font-semibold text-amber-600">{item.category}</div>
                    <p className="mt-3 text-sm leading-relaxed text-navy-700/70">{item.description}</p>
                  </Card>
                ))}
              </div>
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {/* Reviews */}
      {reviews.length > 0 ? (
        <Section className="bg-mist-100">
          <Container>
            <Reveal>
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <SectionHeading
                  eyebrow="Kundenstimmen"
                  title="Was unsere Kunden sagen"
                  description={`Ø ${avgRating} von 5 Sternen aus ${reviews.length}+ Bewertungen zufriedener Kunden.`}
                />
                <Button href="/rezensionen" variant="outline" className="shrink-0">
                  Alle Rezensionen
                </Button>
              </div>
            </Reveal>
            <Reveal delayMs={100}>
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                {reviews.slice(0, 4).map((review) => (
                  <Card key={review.author}>
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon key={i} className={`h-4 w-4 ${i < review.rating ? "" : "opacity-25"}`} />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-navy-800/90">&ldquo;{review.text}&rdquo;</p>
                    <div className="mt-4 text-sm font-semibold text-navy-900">{review.author}</div>
                    <div className="text-xs text-navy-700/60">{review.company}</div>
                  </Card>
                ))}
              </div>
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {/* News */}
      {news.length > 0 ? (
        <Section>
          <Container>
            <Reveal>
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <SectionHeading eyebrow="Aktuelles" title="News aus dem Unternehmen" />
                <Button href="/news" variant="outline" className="shrink-0">
                  Alle News
                </Button>
              </div>
            </Reveal>
            <Reveal delayMs={100}>
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                {news.slice(0, 3).map((post) => (
                  <Link
                    key={post.slug}
                    href={`/news/${post.slug}`}
                    className="group flex flex-col rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-navy-950/10"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                      {post.category}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-navy-900 group-hover:text-amber-700">
                      {post.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-navy-700/70">{post.excerpt}</p>
                    <time className="mt-4 text-xs text-navy-700/50">
                      {new Date(post.date).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}
                    </time>
                  </Link>
                ))}
              </div>
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {/* Karriere teaser */}
      <Section className="bg-navy-900 text-white">
        <Container>
          <Reveal>
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div>
                <Eyebrow>Karriere</Eyebrow>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Werde Teil unseres Teams
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/70">
                  Wir suchen Berufskraftfahrer, Disponenten, Lagerlogistiker und Auszubildende, die mit uns wachsen
                  wollen. Aktuell {jobs.length} offene Stellen in Falkenwalde.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="/karriere">Stellenangebote ansehen</Button>
                  <Button href="/bewerbung" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Initiativbewerbung
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {jobs.slice(0, 3).map((job) => (
                  <Link
                    key={job.slug}
                    href={`/karriere/${job.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/30 hover:bg-white/10"
                  >
                    <span>
                      <span className="block font-semibold">{job.title}</span>
                      <span className="text-white/50">
                        {job.location} · {job.type}
                      </span>
                    </span>
                    <ArrowRightIcon className="h-4 w-4 shrink-0 text-amber-400 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Partners */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeading eyebrow="Partner" title="Starke Partnerschaften im Ostseeraum" align="center" />
          </Reveal>
          <Reveal delayMs={100}>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {partners.map((partner) => (
                <div
                  key={partner.name}
                  className="flex flex-col items-center justify-center rounded-xl border border-navy-900/8 bg-white px-3 py-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-navy-950/10"
                >
                  <span className="text-sm font-semibold text-navy-900">{partner.name}</span>
                  <span className="mt-1 text-[11px] text-navy-700/50">{partner.category}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* CTA */}
      <section className="relative bg-amber-400">
        <Container className="py-16 sm:py-24">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-navy-950 sm:text-3xl">
                Bereit für Ihre nächste Sendung?
              </h2>
              <p className="mt-2 max-w-xl text-navy-950/70">
                Reichen Sie Ihren Auftrag direkt online ein oder kontaktieren Sie unsere Disposition.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/auftrag" variant="secondary">
                Auftrag einreichen
              </Button>
              <Button href="/standort" variant="outline" className="border-navy-950/20 text-navy-950 hover:bg-navy-950/10">
                Kontakt
              </Button>
            </div>
          </div>
        </Container>
        <WaveDivider fillClassName="fill-navy-950" />
      </section>
    </>
  );
}
