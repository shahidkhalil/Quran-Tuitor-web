import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { TrustStrip } from "@/components/listings/trust-strip";
import {
  COURSE_LANDINGS,
  getCourseLanding,
  courseLandingSlugs,
} from "@/domain/course-landings";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return courseLandingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const course = getCourseLanding(slug);
  if (!course) return { title: "Course" };
  return {
    title: course.title,
    description: course.description,
  };
}

export default async function CourseLandingPage({ params }: Props) {
  const { slug } = await params;
  const course = getCourseLanding(slug);
  if (!course) notFound();

  const others = COURSE_LANDINGS.filter((c) => c.slug !== course.slug).slice(
    0,
    4,
  );

  return (
    <MarketingShell>
      <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-10 md:px-8 md:py-14">
        <p className="text-sm font-semibold text-[var(--color-on-surface-muted)]">
          <Link href="/courses" className="hover:text-[var(--color-primary)]">
            Courses
          </Link>
          <span aria-hidden="true"> / </span>
          {course.eyebrow}
        </p>
        <p className="eyebrow mt-4 text-[var(--color-accent)]">{course.eyebrow}</p>
        <h1 className="display-title mt-2 max-w-2xl text-3xl text-[var(--color-primary)] md:text-5xl">
          {course.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--color-on-surface-muted)]">
          {course.description}
        </p>
        <TrustStrip className="mt-4" />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={course.browseHref} className="btn-panel btn-panel-primary">
            {course.browseLabel}
          </Link>
          <Link href="/reviews" className="btn-panel btn-panel-secondary">
            Read reviews
          </Link>
        </div>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="surface-card p-6">
            <p className="eyebrow text-[var(--color-accent)]">Why this path</p>
            <ul className="mt-4 space-y-3">
              {course.highlights.map((item) => (
                <li
                  key={item}
                  className="text-sm font-semibold text-[var(--color-on-surface)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="surface-card p-6">
            <p className="eyebrow text-[var(--color-accent)]">Who it’s for</p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
              {course.whoFor}
            </p>
            <ol className="mt-6 space-y-2 text-sm text-[var(--color-on-surface)]">
              <li>
                <span className="font-semibold text-[var(--color-accent)]">
                  1.
                </span>{" "}
                Browse filtered tutors
              </li>
              <li>
                <span className="font-semibold text-[var(--color-accent)]">
                  2.
                </span>{" "}
                Book a free trial ($0)
              </li>
              <li>
                <span className="font-semibold text-[var(--color-accent)]">
                  3.
                </span>{" "}
                Continue with platform checkout
              </li>
            </ol>
          </div>
        </section>

        <section className="mt-14">
          <p className="eyebrow text-[var(--color-accent)]">More courses</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/courses/${c.slug}`}
                  className="inline-flex rounded-full border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-4 py-2 text-xs font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]/40"
                >
                  {c.eyebrow}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/browse"
                className="inline-flex rounded-full border border-[var(--color-outline)] px-4 py-2 text-xs font-semibold text-[var(--color-on-surface-muted)]"
              >
                All tutors
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </MarketingShell>
  );
}
