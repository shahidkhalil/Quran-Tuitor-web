import Link from "next/link";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { listAdminListingsOverview } from "@/server/actions/admin-ops";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Listings" };

export default async function AdminListingsPage() {
  const { listings, error } = await listAdminListingsOverview();

  return (
    <div>
      <PanelPageHeader
        eyebrow="Operations"
        title="Listings"
        description="All tutor listings — published and draft. Use Tutors for warn/suspend/unlist."
        actions={
          <Link href="/admin/tutors" className="btn-panel btn-panel-secondary">
            Tutor enforcement
          </Link>
        }
      />

      {error ? (
        <p role="alert" className="mb-6 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}

      {listings.length === 0 && !error ? (
        <div className="surface-card px-5 py-12 text-center">
          <p className="display-title text-xl text-[var(--color-primary)]">
            No listings yet
          </p>
        </div>
      ) : (
        <div className="overflow-hidden surface-card">
          <div className="hidden border-b border-[var(--color-outline)] bg-[var(--color-surface-muted)]/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.06em] text-[var(--color-on-surface-muted)] md:grid md:grid-cols-[1.5fr_0.8fr_0.8fr_auto] md:gap-4">
            <span>Listing</span>
            <span>Rate</span>
            <span>Status</span>
            <span className="text-right">Open</span>
          </div>
          <ul className="divide-y divide-[var(--color-outline)]">
            {listings.map((l) => (
              <li
                key={l.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[1.5fr_0.8fr_0.8fr_auto] md:items-center md:gap-4"
              >
                <div>
                  <p className="font-semibold text-[var(--color-on-surface)]">
                    {l.headline}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-[var(--color-on-surface-muted)]">
                    {l.tutorId.slice(0, 12)}…
                  </p>
                </div>
                <p className="text-sm">
                  {l.rateUsd != null ? `$${l.rateUsd}/lesson` : "—"}
                </p>
                <p>
                  {l.published ? (
                    <span className="status-pill status-pill-success">Published</span>
                  ) : (
                    <span className="status-pill status-pill-neutral">Draft</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Link
                    href={`/admin/tutors/${l.tutorId}`}
                    className="btn-panel btn-panel-secondary !min-h-9 !px-3 text-[11px]"
                  >
                    Enforce
                  </Link>
                  {l.published ? (
                    <Link
                      href={`/browse/${l.id}`}
                      className="btn-panel btn-panel-secondary !min-h-9 !px-3 text-[11px]"
                    >
                      Public
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
