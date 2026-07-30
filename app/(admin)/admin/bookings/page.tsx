import Link from "next/link";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { listAdminBookingsOverview } from "@/server/actions/admin-ops";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bookings" };

export default async function AdminBookingsPage() {
  const { rows, error } = await listAdminBookingsOverview();

  return (
    <div>
      <PanelPageHeader
        eyebrow="Operations"
        title="Bookings overview"
        description="Recent free trials and paid lessons across the marketplace (latest 100 updates)."
        actions={
          <span className="status-pill status-pill-neutral">{rows.length} shown</span>
        }
      />

      {error ? (
        <p role="alert" className="mb-6 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}

      {rows.length === 0 && !error ? (
        <div className="surface-card px-5 py-12 text-center">
          <p className="display-title text-xl text-[var(--color-primary)]">
            No bookings yet
          </p>
        </div>
      ) : (
        <div className="overflow-hidden surface-card">
          <div className="hidden border-b border-[var(--color-outline)] bg-[var(--color-surface-muted)]/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.06em] text-[var(--color-on-surface-muted)] lg:grid lg:grid-cols-[0.7fr_0.8fr_1fr_1fr_1.2fr_auto] lg:gap-3">
            <span>Type</span>
            <span>Status</span>
            <span>When</span>
            <span>Parent</span>
            <span>Tutor</span>
            <span className="text-right">Listing</span>
          </div>
          <ul className="divide-y divide-[var(--color-outline)]">
            {rows.map((r) => (
              <li
                key={`${r.kind}-${r.id}`}
                className="grid gap-2 px-5 py-4 text-sm lg:grid-cols-[0.7fr_0.8fr_1fr_1fr_1.2fr_auto] lg:items-center lg:gap-3"
              >
                <span className="status-pill status-pill-accent">
                  {r.kind === "trial" ? "Trial" : "Lesson"}
                </span>
                <span className="font-semibold">{r.statusLabel}</span>
                <span className="text-[var(--color-on-surface-muted)]">
                  {new Date(r.when).toLocaleString()}
                </span>
                <span className="truncate font-mono text-xs">{r.parentId.slice(0, 10)}…</span>
                <span className="truncate font-mono text-xs">{r.tutorId.slice(0, 10)}…</span>
                <div className="lg:text-right">
                  <Link
                    href={`/browse/${r.listingId}`}
                    className="btn-panel btn-panel-secondary !min-h-9 !px-3 text-[11px]"
                  >
                    Listing
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
