import Link from "next/link";

type Faq = { q: string; a: string; href: string };

export function HelpFaqPanel({
  faqs,
  moreHref = "/parent/help",
}: {
  faqs: readonly Faq[];
  moreHref?: string;
}) {
  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-[var(--color-accent)]">Need help?</p>
          <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
            Quick answers
          </h2>
        </div>
        <Link href={moreHref} className="btn-panel btn-panel-secondary !min-h-9">
          All help
        </Link>
      </div>
      <ul className="mt-4 space-y-3">
        {faqs.slice(0, 5).map((f) => (
          <li key={f.q}>
            <Link
              href={f.href}
              className="block rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-2.5 transition hover:border-[var(--color-primary)]/35"
            >
              <p className="text-sm font-semibold text-[var(--color-primary)]">
                {f.q}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
                {f.a}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
