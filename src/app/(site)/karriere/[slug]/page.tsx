import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Container, Section } from "@/components/ui/primitives";
import { CheckIcon, MapPinIcon } from "@/components/ui/icons";
import { getJobs } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/karriere/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const jobs = await getJobs();
  const job = jobs.find((j) => j.slug === slug);
  if (!job) return {};
  return { title: job.title, description: job.description };
}

export default async function JobDetailPage(props: PageProps<"/karriere/[slug]">) {
  const { slug } = await props.params;
  const jobs = await getJobs();
  const job = jobs.find((j) => j.slug === slug);
  if (!job) notFound();

  return (
    <>
      <section className="bg-navy-950 text-white">
        <Container className="py-16 sm:py-20">
          <Link href="/karriere" className="text-sm font-medium text-white/60 hover:text-white">
            ← Zurück zu allen Stellenangeboten
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="amber">{job.department}</Badge>
            <Badge>{job.type}</Badge>
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{job.title}</h1>
          <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
            <MapPinIcon className="h-4 w-4" />
            {job.location}
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-navy-900">Über die Position</h2>
                <p className="mt-3 text-sm leading-relaxed text-navy-700/80">{job.description}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy-900">Deine Aufgaben</h2>
                <ul className="mt-3 space-y-2.5">
                  {job.tasks.map((task) => (
                    <li key={task} className="flex items-start gap-2.5 text-sm text-navy-800">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy-900">Das bringst du mit</h2>
                <ul className="mt-3 space-y-2.5">
                  {job.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2.5 text-sm text-navy-800">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside>
              <div className="sticky top-24 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Jetzt bewerben</h2>
                <p className="mt-3 text-sm leading-relaxed text-navy-700/70">
                  Sende uns deine Bewerbung direkt über unser Bewerbungsportal.
                </p>
                <div className="mt-4">
                  <Button href={`/bewerbung?stelle=${encodeURIComponent(job.title)}`} className="w-full justify-center" icon={false}>
                    Für diese Stelle bewerben
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
