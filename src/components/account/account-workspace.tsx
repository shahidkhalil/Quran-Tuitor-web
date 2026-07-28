import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfilePhotoForm } from "@/components/profile/profile-photo-form";
import { UserAvatar } from "@/components/profile/user-avatar";
import type { ReactNode } from "react";

export type AccountDetailRow = {
  label: string;
  value: string;
  hint?: string;
};

type Props = {
  email: string | null;
  photoUrl: string | null;
  roleLabel: string;
  badge?: string;
  safetyNote?: string;
  /** Structured account fields shown under the hero */
  details?: AccountDetailRow[];
  shortcuts?: { href: string; title: string; body: string; icon?: string }[];
  /** Listing / profile cards (e.g. Edit listing) */
  extra?: ReactNode;
};

export function AccountWorkspace({
  email,
  photoUrl,
  roleLabel,
  badge,
  safetyNote,
  details = [],
  shortcuts = [],
  extra,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
      <div className="space-y-5">
        <section className="account-hero overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-outline)] shadow-[var(--shadow-md)]">
          <div className="account-hero-band px-5 py-6 sm:px-7 sm:py-8">
            <div className="flex flex-wrap items-center gap-4">
              <UserAvatar
                photoUrl={photoUrl}
                email={email}
                size="xl"
                tone="dark"
                className="ring-white/25"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
                  Signed in
                </p>
                <p className="mt-1 truncate font-[family-name:var(--font-fraunces)] text-2xl text-white sm:text-3xl">
                  {email ?? "Account"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {roleLabel}
                  </span>
                  {badge ? (
                    <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-warning)]">
                      {badge}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface-elevated)] px-5 py-5 sm:px-7">
            {safetyNote ? (
              <p className="mb-4 text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
                {safetyNote}
              </p>
            ) : null}
            <SignOutButton />
          </div>
        </section>

        {details.length > 0 ? (
          <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--color-outline)] px-5 py-4 sm:px-6">
              <p className="eyebrow text-[var(--color-accent)]">Account</p>
              <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
                Account details
              </h2>
            </div>
            <dl className="divide-y divide-[var(--color-outline)]">
              {details.map((row) => (
                <div
                  key={row.label}
                  className="grid gap-1 px-5 py-3.5 sm:grid-cols-[10rem_1fr] sm:gap-4 sm:px-6"
                >
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
                    {row.label}
                  </dt>
                  <dd>
                    <p className="text-sm font-semibold text-[var(--color-on-surface)] break-all">
                      {row.value}
                    </p>
                    {row.hint ? (
                      <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
                        {row.hint}
                      </p>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <ProfilePhotoForm photoUrl={photoUrl} email={email} embedded />
        {extra}
      </div>

      {shortcuts.length > 0 ? (
        <aside className="space-y-3">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <p className="eyebrow text-[var(--color-accent)]">Workspace</p>
              <p className="display-title mt-1 text-xl text-[var(--color-primary)]">
                Shortcuts
              </p>
            </div>
          </div>
          <ul className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-sm)]">
            {shortcuts.map((item, i) => (
              <li
                key={item.href}
                className={
                  i > 0 ? "border-t border-[var(--color-outline)]/80" : undefined
                }
              >
                <Link
                  href={item.href}
                  className="group flex items-start gap-3 px-4 py-4 transition hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] sm:px-5"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,var(--color-primary),#1a6b52)] text-sm font-bold text-white shadow-[var(--shadow-xs)]"
                  >
                    {item.icon ?? item.title.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[var(--color-on-surface)]">
                        {item.title}
                      </span>
                      <span className="text-[var(--color-primary)] opacity-40 transition group-hover:opacity-100">
                        →
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm text-[var(--color-on-surface-muted)]">
                      {item.body}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}
