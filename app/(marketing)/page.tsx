import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { COURSE_LANDINGS } from "@/domain/course-landings";
import {
  LISTING_GENDER_OPTIONS,
  SUBJECT_OPTIONS,
  genderLabel,
} from "@/domain/tutor-listings";

const QUICK_FIND_LINKS = [
  {
    href: "/browse?gender=female&sort=rating",
    label: "Female tutors",
    hint: "Sisters teaching online",
  },
  {
    href: "/browse?gender=male&sort=rating",
    label: "Male tutors",
    hint: "Brothers teaching online",
  },
  {
    href: "/browse?children=1&sort=rating",
    label: "Tutors for kids",
    hint: "Child teaching experience",
  },
  {
    href: "/browse?subject=tajweed&sort=rating",
    label: "Tajweed",
    hint: "Pronunciation & rules",
  },
  {
    href: "/browse?subject=hifz&sort=rating",
    label: "Hifz",
    hint: "Memorisation support",
  },
  {
    href: "/browse?subject=arabic&sort=rating",
    label: "Arabic",
    hint: "Language with Qur’an",
  },
  {
    href: "/browse?subject=quran_reading&sort=rating",
    label: "Qur’an reading",
    hint: "Beginner-friendly",
  },
  {
    href: "/browse?gender=female&children=1&sort=rating",
    label: "Female · kids",
    hint: "Common family preference",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      <div className="hero-marketplace">
        <MarketingNav variant="on-hero" />

        <main id="main-content">
          <section
            aria-labelledby="hero-brand"
            className="relative mx-auto flex w-full max-w-[1160px] flex-col px-4 pb-16 pt-10 md:px-8 md:pb-24 md:pt-16"
          >
            <div className="reveal-up max-w-3xl space-y-5">
              <p
                id="hero-brand"
                className="display-title text-[2.35rem] text-white md:text-[3rem]"
              >
                Quran Tutor
              </p>
              <h1 className="display-title text-[1.85rem] text-white/95 md:text-[2.65rem] md:leading-[1.1]">
                Find a verified Quran tutor your family can trust
              </h1>
              <p className="max-w-xl text-base text-white/80 md:text-lg">
                Browse teachers, book a free trial, then continue with platform
                payments — never pay a tutor directly.
              </p>
            </div>

            <form
              action="/browse"
              method="get"
              className="reveal-up-delay mt-10 w-full max-w-2xl rounded-[var(--radius-xl)] bg-white p-2 shadow-[var(--shadow-lg)]"
            >
              <label htmlFor="hero-q" className="sr-only">
                Search tutors
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  id="hero-q"
                  name="q"
                  type="search"
                  placeholder="Search Tajweed, Hifz, Arabic, Urdu…"
                  className="min-h-12 flex-1 rounded-[var(--radius-lg)] border-0 bg-transparent px-4 text-base text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-muted)] focus:outline-none focus:ring-0"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-7 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-hover)]"
                >
                  Find tutors
                </button>
              </div>
            </form>

            <div className="reveal-up-delay-2 mt-5 flex flex-wrap gap-2">
              {COURSE_LANDINGS.slice(0, 5).map((course) => (
                <Link
                  key={course.slug}
                  href={`/courses/${course.slug}`}
                  className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/20"
                >
                  {course.eyebrow}
                </Link>
              ))}
              {SUBJECT_OPTIONS.filter(
                (s) =>
                  !["tajweed", "hifz", "arabic", "quran_reading"].includes(
                    s.value,
                  ),
              ).map((subject) => (
                <Link
                  key={subject.value}
                  href={`/browse?subject=${subject.value}`}
                  className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/20"
                >
                  {subject.label}
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>

      <section className="section-pad bg-[var(--color-surface-elevated)]">
        <div className="mx-auto max-w-[1160px] px-4 md:px-8">
          <p className="eyebrow text-[var(--color-accent)]">Quick find</p>
          <h2 className="display-title mt-2 text-3xl text-[var(--color-primary)] md:text-4xl">
            Start with gender or subject
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--color-on-surface-muted)]">
            Jump straight into Browse with filters applied — then book a free
            trial when you find a fit.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_FIND_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="surface-card surface-card-interactive flex h-full flex-col p-5"
                >
                  <span className="font-[family-name:var(--font-fraunces)] text-lg font-medium text-[var(--color-primary)]">
                    {item.label}
                  </span>
                  <span className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                    {item.hint}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-[var(--color-on-surface-muted)]">
            Prefer course pages?{" "}
            <Link
              href="/courses"
              className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
            >
              Browse courses
            </Link>
            {" · "}
            <Link
              href="/guides"
              className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
            >
              Parent guides
            </Link>
            {" · "}
            <Link
              href="/blog"
              className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
            >
              Blog
            </Link>
            {" · "}
            {LISTING_GENDER_OPTIONS.map((g, i) => (
              <span key={g.value}>
                {i > 0 ? " · " : null}
                <Link
                  href={`/browse?gender=${g.value}&sort=rating`}
                  className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  {genderLabel(g.value)} tutors
                </Link>
              </span>
            ))}
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-[1160px] px-4 md:px-8">
          <p className="eyebrow text-[var(--color-accent)]">How it works</p>
          <h2 className="display-title mt-2 text-3xl text-[var(--color-primary)] md:text-4xl">
            From browse to first lesson
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Browse verified tutors",
                body: "Filter by subject, language, gender, and rate — compare shortlists side by side.",
              },
              {
                step: "02",
                title: "Book a free trial",
                body: "No card required. Meet on a secure join link after the tutor accepts.",
              },
              {
                step: "03",
                title: "Pay on the platform",
                body: "Convert when it feels right. Checkout stays on-platform with a clear receipt.",
              },
            ].map((item) => (
              <li key={item.step} className="surface-card p-6 md:p-7">
                <p className="text-sm font-bold text-[var(--color-accent)]">
                  {item.step}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-fraunces)] text-xl font-medium text-[var(--color-primary)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-pad bg-[var(--color-surface-elevated)]">
        <div className="mx-auto max-w-[1160px] px-4 md:px-8">
          <p className="eyebrow text-[var(--color-primary)]">Trust</p>
          <h2 className="display-title mt-2 max-w-xl text-3xl text-[var(--color-primary)] md:text-4xl">
            Built for families who need calm, clear ops
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Vetted tutor applications",
              "Platform payments only",
              "Parent-visible messaging",
              "Free rematch support",
            ].map((label) => (
              <li
                key={label}
                className="rounded-[var(--radius-lg)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-5 py-5 text-sm font-semibold text-[var(--color-on-surface)] shadow-[var(--shadow-xs)]"
              >
                {label}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="inline-flex min-h-12 items-center rounded-full bg-[var(--color-primary)] px-7 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-primary)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-primary-hover)]"
            >
              Browse tutors
            </Link>
            <Link
              href="/guides"
              className="inline-flex min-h-12 items-center rounded-full border border-[var(--color-outline-strong)] bg-transparent px-7 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)] transition hover:bg-[var(--color-surface-muted)]"
            >
              Parent guides
            </Link>
            <Link
              href="/blog"
              className="inline-flex min-h-12 items-center rounded-full border border-[var(--color-outline-strong)] bg-transparent px-7 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)] transition hover:bg-[var(--color-surface-muted)]"
            >
              Blog
            </Link>
            <Link
              href="/reviews"
              className="inline-flex min-h-12 items-center rounded-full border border-[var(--color-outline-strong)] bg-transparent px-7 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)] transition hover:bg-[var(--color-surface-muted)]"
            >
              Read reviews
            </Link>
            <Link
              href="/teach"
              className="inline-flex min-h-12 items-center rounded-full border border-[var(--color-outline-strong)] bg-transparent px-7 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)] transition hover:bg-[var(--color-surface-muted)]"
            >
              Teach with us
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
