import Link from "next/link";
import { AdminCommissionForm } from "@/components/admin/admin-commission-form";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { formatCommissionPercent } from "@/domain/ledger";
import { getCommissionConfigForAdmin } from "@/server/actions/admin-ops";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

type Props = {
  searchParams: Promise<{ saved?: string }>;
};

export default async function AdminSettingsPage({ searchParams }: Props) {
  const { saved } = await searchParams;
  const { config, error } = await getCommissionConfigForAdmin();

  return (
    <div className="space-y-6">
      <PanelPageHeader
        eyebrow="Operations"
        title="Settings"
        description="Commission and marketplace ops config. Privileged changes are audited."
      />

      {saved ? (
        <p
          role="status"
          className="rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          Commission updated to {formatCommissionPercent(config.commission_bps)}.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <AdminCommissionForm currentBps={config.commission_bps} />
        <div className="surface-card space-y-3 p-5 md:p-6 text-sm">
          <p className="font-semibold text-[var(--color-on-surface)]">
            Config source
          </p>
          <p className="text-[var(--color-on-surface-muted)]">
            Active source: <strong>{config.source}</strong>
          </p>
          {config.updated_at ? (
            <p className="text-[var(--color-on-surface-muted)]">
              Last update: {new Date(config.updated_at).toLocaleString()}
            </p>
          ) : (
            <p className="text-[var(--color-on-surface-muted)]">
              No Firestore override yet — using env/default until you save.
            </p>
          )}
          <div className="pt-2">
            <Link href="/admin/ledger" className="btn-panel btn-panel-secondary">
              Open ledger tools
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
