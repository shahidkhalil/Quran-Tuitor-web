import Link from "next/link";
import { homePathForRole } from "@/domain/roles";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";

type Props = {
  variant?: "light" | "on-hero";
};

function dashboardLabel(role: string | undefined) {
  switch (role) {
    case "admin":
      return "Admin";
    case "tutor":
    case "tutor_applicant":
      return "Tutor workspace";
    default:
      return "My dashboard";
  }
}

export async function MarketingNav({ variant = "light" }: Props) {
  const onHero = variant === "on-hero";
  const profile = isAuthConfigured() ? await getCurrentProfile() : null;
  const homeHref = profile ? homePathForRole(profile.role) : null;

  const navLinkClass = onHero
    ? "hidden min-h-11 items-center rounded-[var(--radius-md)] px-3 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
    : "hidden min-h-11 items-center rounded-[var(--radius-md)] px-3 text-sm font-semibold text-[var(--color-on-surface-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)] sm:inline-flex";

  const ctaClass = onHero
    ? "inline-flex min-h-11 items-center rounded-full bg-white px-5 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-accent-soft)]"
    : "inline-flex min-h-11 items-center rounded-full bg-[var(--color-primary)] px-5 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-primary)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-primary-hover)]";

  return (
    <header
      className={onHero ? "relative z-20" : "sticky top-0 z-40 nav-glass"}
    >
      <div className="mx-auto flex w-full max-w-[1160px] items-center justify-between gap-4 px-4 py-4 md:px-8">
        <Link
          href={homeHref ?? "/"}
          className={
            onHero
              ? "display-title text-lg font-semibold tracking-tight text-white md:text-xl"
              : "display-title text-lg font-semibold tracking-tight text-[var(--color-primary)] md:text-xl"
          }
        >
          Quran Tutor
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
          <Link href="/browse" className={navLinkClass}>
            Browse tutors
          </Link>
          <Link href="/courses" className={navLinkClass}>
            Courses
          </Link>
          <Link href="/guides" className={navLinkClass}>
            Guides
          </Link>
          <Link href="/blog" className={navLinkClass}>
            Blog
          </Link>
          <Link href="/reviews" className={navLinkClass}>
            Reviews
          </Link>
          <Link href="/teach" className={navLinkClass}>
            Teach with us
          </Link>
          {profile && homeHref ? (
            <Link href={homeHref} className={ctaClass}>
              {dashboardLabel(profile.role)}
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className={navLinkClass}>
                Sign in
              </Link>
              <Link href="/register" className={ctaClass}>
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
