import Link from "next/link";
import { homePathForRole } from "@/domain/roles";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";

export async function MarketingFooter() {
  const profile = isAuthConfigured() ? await getCurrentProfile() : null;
  const homeHref = profile ? homePathForRole(profile.role) : null;

  return (
    <footer className="border-t border-[var(--color-outline)] bg-[var(--color-surface-elevated)]">
      <div className="mx-auto grid w-full max-w-[1160px] gap-8 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <p className="display-title text-xl text-[var(--color-primary)]">
            Quran Tutor
          </p>
          <p className="mt-3 max-w-sm text-sm text-[var(--color-on-surface-muted)]">
            A managed marketplace for verified Quran teachers — browse, trial,
            then pay safely on-platform.
          </p>
        </div>
        <div>
          <p className="eyebrow text-[var(--color-on-surface-muted)]">Explore</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            <li>
              <Link
                href="/browse"
                className="text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
              >
                Browse tutors
              </Link>
            </li>
            <li>
              <Link
                href="/courses"
                className="text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
              >
                Courses
              </Link>
            </li>
            <li>
              <Link
                href="/guides"
                className="text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
              >
                Guides
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                className="text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
              >
                Blog
              </Link>
            </li>
            <li>
              <Link
                href="/reviews"
                className="text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
              >
                Reviews
              </Link>
            </li>
            <li>
              <Link
                href="/teach"
                className="text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
              >
                Teach with us
              </Link>
            </li>
            <li>
              <Link
                href="/shortlist"
                className="text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
              >
                Shortlist
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-[var(--color-on-surface-muted)]">Account</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            {profile && homeHref ? (
              <li>
                <Link
                  href={homeHref}
                  className="text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
                >
                  My dashboard
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link
                    href="/sign-in"
                    className="text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
                  >
                    Create account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--color-outline)]">
        <p className="mx-auto max-w-[1160px] px-4 py-4 text-xs text-[var(--color-on-surface-muted)] md:px-8">
          Platform payments · Parent-visible chat · Free rematch · USD pricing
        </p>
      </div>
    </footer>
  );
}
