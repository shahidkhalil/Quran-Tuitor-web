import Link from "next/link";

export type ActiveTutorRow = {
  listingId: string;
  headline: string;
  photoUrl?: string | null;
  nextLabel: string;
  href: string;
  messageHref?: string;
};

export function ActiveTutorsPanel({ tutors }: { tutors: ActiveTutorRow[] }) {
  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-[var(--color-accent)]">Your tutors</p>
          <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
            Current relationships
          </h2>
        </div>
        <Link href="/browse" className="btn-panel btn-panel-secondary !min-h-9">
          Find a tutor
        </Link>
      </div>

      {tutors.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-[var(--color-outline)] px-4 py-10 text-center">
          <p className="text-sm font-semibold text-[var(--color-on-surface)]">
            You have not hired anyone yet
          </p>
          <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
            Book a free trial to start a relationship with a verified tutor.
          </p>
          <Link href="/browse" className="btn-panel btn-panel-primary mt-4 inline-flex">
            Find a tutor
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {tutors.map((t) => (
            <li
              key={t.listingId}
              className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-3"
            >
              <div className="size-10 shrink-0 overflow-hidden rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
                {t.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.photoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    {t.headline.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[var(--color-on-surface)]">
                  {t.headline}
                </p>
                <p className="text-xs text-[var(--color-on-surface-muted)]">
                  {t.nextLabel}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={t.href} className="btn-panel btn-panel-primary !min-h-9">
                  Open
                </Link>
                {t.messageHref ? (
                  <Link
                    href={t.messageHref}
                    className="btn-panel btn-panel-secondary !min-h-9"
                  >
                    Message
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
