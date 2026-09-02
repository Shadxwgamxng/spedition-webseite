import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Container, Section } from "@/components/ui/primitives";
import { news } from "@/lib/data";
import { ArrowRightIcon } from "@/components/ui/icons";

export function generateStaticParams() {
  return news.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<"/news/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = news.find((p) => p.slug === slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function NewsDetailPage(props: PageProps<"/news/[slug]">) {
  const { slug } = await props.params;
  const post = news.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = news.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <section className="bg-navy-950 text-white">
        <Container className="py-16 sm:py-20">
          <Link href="/news" className="text-sm font-medium text-white/60 hover:text-white">
            ← Zurück zu News
          </Link>
          <div className="mt-4">
            <Badge tone="amber">{post.category}</Badge>
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{post.title}</h1>
          <time className="mt-4 block text-sm text-white/50">
            {new Date(post.date).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}
          </time>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="mx-auto max-w-2xl space-y-5 text-base leading-relaxed text-navy-800">
            {post.content.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {related.length ? (
            <div className="mx-auto mt-16 max-w-2xl border-t border-navy-900/10 pt-10">
              <h2 className="text-lg font-semibold text-navy-900">Weitere News</h2>
              <div className="mt-5 space-y-4">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/news/${p.slug}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-navy-900/8 bg-white p-4 hover:bg-mist-100"
                  >
                    <span className="text-sm font-medium text-navy-900">{p.title}</span>
                    <ArrowRightIcon className="h-4 w-4 shrink-0 text-amber-600" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mx-auto mt-12 max-w-2xl">
            <Button href="/auftrag">Auftrag einreichen</Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
