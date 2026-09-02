import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Badge, Container, Section } from "@/components/ui/primitives";
import { getNews } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News",
  description: "Aktuelles aus dem Unternehmen: Fuhrpark, Digitalisierung, Personal und mehr.",
};

export default async function NewsPage() {
  const news = await getNews();
  return (
    <>
      <PageHero eyebrow="Aktuelles" title="News von Baltic Freight" description="Neuigkeiten rund um Fuhrpark, Digitalisierung, Standort und Team." />
      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map((post) => (
              <Link
                key={post.slug}
                href={`/news/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Badge tone="amber">{post.category}</Badge>
                <h2 className="mt-3 text-lg font-semibold text-navy-900 group-hover:text-amber-700">{post.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-navy-700/70">{post.excerpt}</p>
                <time className="mt-4 text-xs text-navy-700/50">
                  {new Date(post.date).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}
                </time>
              </Link>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
