import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { TrustStrip } from "@/components/listings/trust-strip";
import { COURSE_LANDINGS } from "@/domain/course-landings";

export const metadata = {
  title: "Courses",
  description:
    "Tajweed, Hifz, Arabic, Qur’an reading, and kids classes — find verified tutors and book a free trial.",
};

export default function CoursesIndexPage() {
  return (
    <MarketingShell>
      <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-10 md:px-8 md:py-14">
        <p className="eyebrow text-[var(--color-accent)]">Learn</p>
        <h1 className="display-title mt-2 text-3xl text-[var(--color-primary)] md:text-4xl">
          Quran courses online
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[var(--color-on-surface-muted)]">
          Pick a focus, then browse verified tutors filtered for that subject.
          Free trial first — pay on the platform when you continue.
        </p>
        <TrustStrip className="mt-4" />

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSE_LANDINGS.map((course) => (
            <li key={course.slug}>
              <Link
                href={`/courses/${course.slug}`}
                className="surface-card surface-card-interactive block h-full p-5"
              >
                <p className="eyebrow text-[var(--color-accent)]">
                  {course.eyebrow}
                </p>
                <h2 className="display-title mt-2 text-xl text-[var(--color-primary)]">
                  {course.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-[var(--color-on-surface-muted)]">
                  {course.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-[var(--color-primary)]">
                  Learn more →
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/browse" className="btn-panel btn-panel-primary">
            Browse all tutors
          </Link>
          <Link href="/guides" className="btn-panel btn-panel-secondary">
            Parent guides
          </Link>
        </div>
      </main>
    </MarketingShell>
  );
}
