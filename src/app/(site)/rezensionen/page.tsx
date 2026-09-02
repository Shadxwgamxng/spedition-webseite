import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Card, Container, Section } from "@/components/ui/primitives";
import { StarIcon } from "@/components/ui/icons";
import { getReviews } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rezensionen",
  description: "Das sagen unsere Kunden über die Zusammenarbeit mit der Baltic Freight GmbH.",
};

export default async function RezensionenPage() {
  const reviews = await getReviews();
  const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  return (
    <>
      <PageHero
        eyebrow="Rezensionen"
        title="Was unsere Kunden über uns sagen"
        description="Transparenz ist uns wichtig – hier finden Sie eine Auswahl echter Rückmeldungen unserer Kunden."
      />

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="rounded-2xl border border-navy-900/8 bg-white p-6">
              <div className="text-4xl font-bold text-navy-900">{avgRating}</div>
              <div className="mt-1 flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className={`h-4 w-4 ${i < Math.round(Number(avgRating)) ? "" : "opacity-25"}`} />
                ))}
              </div>
              <div className="mt-1 text-sm text-navy-700/60">Basierend auf {reviews.length} Bewertungen</div>
              <div className="mt-6 space-y-2">
                {distribution.map((d) => (
                  <div key={d.stars} className="flex items-center gap-3 text-xs text-navy-700/60">
                    <span className="w-8">{d.stars} ★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-900/8">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${(d.count / (reviews.length || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="w-4 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon key={i} className={`h-4 w-4 ${i < review.rating ? "" : "opacity-25"}`} />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-navy-800/90">&ldquo;{review.text}&rdquo;</p>
                  <div className="mt-4 text-sm font-semibold text-navy-900">{review.author}</div>
                  <div className="text-xs text-navy-700/60">{review.company}</div>
                  <time className="mt-1 block text-xs text-navy-700/40">
                    {new Date(review.date).toLocaleDateString("de-DE", { year: "numeric", month: "long" })}
                  </time>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
