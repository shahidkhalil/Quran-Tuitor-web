import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { TrustStrip } from "@/components/listings/trust-strip";
import { GUIDE_ARTICLES } from "@/domain/guides";

export const metadata = {
  title: "Guides",
  description:
    "Practical guides for choosing Quran tutors, free trials, Hifz accountability, and kids classes online.",
};

export default function GuidesIndexPage() {
  return (
    <MarketingShell>
      <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-10 md:px-8 md:py-14">
        <p className="eyebrow text-[var(--color-accent)]">Learn</p>
        <h1 className="display-title mt-2 text-3xl text-[var(--color-primary)] md:text-4xl">
          Parent guides
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[var(--color-on-surface-muted)]">
          Short reads to help you choose a tutor, run a free trial, and keep
          practice going — then browse verified teachers on the platform.
        </p>
        <TrustStrip className="mt-4" />

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {GUIDE_ARTICLES.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className="surface-card surface-card-interactive block h-full p-5"
              >
                <p className="eyebrow text-[var(--color-accent)]">
                  {guide.eyebrow} · {guide.readMinutes} min
                </p>
                <h2 className="display-title mt-2 text-xl text-[var(--color-primary)]">
                  {guide.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-[var(--color-on-surface-muted)]">
                  {guide.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-[var(--color-primary)]">
                  Read guide →
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/browse" className="btn-panel btn-panel-primary">
            Browse tutors
          </Link>
          <Link href="/blog" className="btn-panel btn-panel-secondary">
            Blog
          </Link>
          <Link href="/courses" className="btn-panel btn-panel-secondary">
            Courses
          </Link>
        </div>
      </main>
    </MarketingShell>
  );
}
