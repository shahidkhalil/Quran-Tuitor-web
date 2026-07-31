import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { TrustStrip } from "@/components/listings/trust-strip";
import {
  GUIDE_ARTICLES,
  getGuideArticle,
  guideArticleSlugs,
} from "@/domain/guides";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return guideArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideArticle(slug);
  if (!guide) return { title: "Guide" };
  return {
    title: guide.title,
    description: guide.description,
  };
}

export default async function GuideArticlePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideArticle(slug);
  if (!guide) notFound();

  const others = GUIDE_ARTICLES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <MarketingShell>
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-10 md:px-8 md:py-14">
        <p className="text-sm font-semibold text-[var(--color-on-surface-muted)]">
          <Link href="/guides" className="hover:text-[var(--color-primary)]">
            Guides
          </Link>
          <span aria-hidden="true"> / </span>
          {guide.eyebrow}
        </p>
        <p className="eyebrow mt-4 text-[var(--color-accent)]">
          {guide.eyebrow} · {guide.readMinutes} min read
        </p>
        <h1 className="display-title mt-2 text-3xl text-[var(--color-primary)] md:text-4xl">
          {guide.title}
        </h1>
        <p className="mt-4 text-lg text-[var(--color-on-surface-muted)]">
          {guide.description}
        </p>
        <TrustStrip className="mt-4" />

        <div className="mt-10 space-y-8">
          {guide.sections.map((section, i) => (
            <section key={section.heading}>
              <h2 className="display-title text-xl text-[var(--color-primary)]">
                {i + 1}. {section.heading}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[var(--color-on-surface-muted)]">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 surface-card space-y-4 p-6">
          <p className="eyebrow text-[var(--color-accent)]">Next step</p>
          <p className="display-title text-2xl text-[var(--color-primary)]">
            Ready to find a tutor?
          </p>
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            Free trial first — continue with platform payments when it feels
            right.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={guide.ctaHref} className="btn-panel btn-panel-primary">
              {guide.ctaLabel}
            </Link>
            <Link href="/guides" className="btn-panel btn-panel-secondary">
              More guides
            </Link>
          </div>
        </div>

        {others.length > 0 ? (
          <section className="mt-12">
            <p className="eyebrow text-[var(--color-accent)]">More guides</p>
            <ul className="mt-4 space-y-2">
              {others.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guides/${g.slug}`}
                    className="text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                  >
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </MarketingShell>
  );
}
