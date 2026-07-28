import {
  formatLedgerAmount,
  formatCommissionPercent,
  ledgerEntryKindLabel,
  resolveCommissionBps,
} from "@/domain/ledger";
import {
  payoutStatusLabel,
  type PayoutRequest,
} from "@/domain/payouts";
import { PayoutActionsPanel } from "@/components/payouts/payout-actions-panel";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { listTutorLedger } from "@/server/actions/ledger";
import {
  getTutorPayoutDashboard,
  syncStripeConnectStatus,
} from "@/server/actions/payouts";
import { getCurrentProfile } from "@/server/services/profile";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Earnings" };

type Props = {
  searchParams: Promise<{
    connect?: string;
    payout?: string;
    help?: string;
    error?: string;
  }>;
};

function payoutPill(status: PayoutRequest["status"]) {
  if (status === "paid") return "status-pill status-pill-success";
  if (status === "failed") return "status-pill status-pill-error";
  if (status === "pending") return "status-pill status-pill-warning";
  return "status-pill status-pill-neutral";
}

export default async function TutorEarningsPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/tutor/earnings");
  if (profile.role !== "tutor") redirect("/tutor");

  const params = await searchParams;
  if (params.connect === "return" || params.connect === "refresh") {
    await syncStripeConnectStatus();
  }

  const [{ entries, error }, dash] = await Promise.all([
    listTutorLedger(),
    getTutorPayoutDashboard(),
  ]);

  const totalCents = entries.reduce((sum, e) => sum + e.amount_cents, 0);
  const commissionLabel = formatCommissionPercent(resolveCommissionBps());

  return (
    <>
      <PanelPageHeader
        eyebrow="Ledger"
        title="Earnings & payouts"
        description={`Net after ${commissionLabel} commission. Request payouts to your Stripe Connect account when ready.`}
        actions={
          <Link href="/tutor/calendar" className="btn-panel btn-panel-secondary">
            Calendar
          </Link>
        }
      />

      {params.payout === "paid" ? (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          Payout completed. Your ledger balance updated.
        </p>
      ) : null}

      {params.connect === "return" ? (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          Stripe Connect setup returned.{" "}
          {dash.payoutsEnabled
            ? "Payouts are enabled."
            : "If onboarding isn’t finished, continue setup below."}
        </p>
      ) : null}

      {params.help === "payout-failed" ? (
        <div
          role="status"
          className="mb-4 rounded-[var(--radius-lg)] border border-[var(--color-error)]/25 bg-[var(--color-error)]/5 px-4 py-3 text-sm"
        >
          <p className="font-semibold text-[var(--color-on-surface)]">
            Payout failed — support
          </p>
          <p className="mt-1 text-[var(--color-on-surface-muted)]">
            Full support cases land in a later update. For now, retry after
            checking your Connect account, or contact the platform admin with
            your payout id from the history below.
          </p>
        </div>
      ) : null}

      {params.error === "stripe" ? (
        <p role="alert" className="mb-4 text-sm text-[var(--color-error)]">
          Stripe is not configured on the server.
        </p>
      ) : null}

      {params.error === "connect-not-enabled" ? (
        <div
          role="alert"
          className="mb-4 rounded-[var(--radius-lg)] border border-[var(--color-error)]/25 bg-[var(--color-error)]/5 px-4 py-3 text-sm"
        >
          <p className="font-semibold text-[var(--color-on-surface)]">
            Stripe Connect is not enabled
          </p>
          <p className="mt-1 text-[var(--color-on-surface-muted)]">
            Your Stripe account must sign up for Connect before tutors can
            onboard. Enable it at{" "}
            <a
              href="https://dashboard.stripe.com/connect"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
            >
              dashboard.stripe.com/connect
            </a>
            , or leave{" "}
            <code className="text-xs">PAYOUT_MODE</code> unset / set to{" "}
            <code className="text-xs">simulate</code> for local testing without
            Connect.
          </p>
        </div>
      ) : null}

      {params.error === "simulate-mode" ? (
        <p role="status" className="mb-4 text-sm text-[var(--color-on-surface-muted)]">
          Simulate mode is on — payouts complete without Stripe Connect. Set{" "}
          <code className="text-xs">PAYOUT_MODE=stripe</code> only after Connect
          is enabled on your Stripe account.
        </p>
      ) : null}

      {params.error === "connect" ? (
        <p role="alert" className="mb-4 text-sm text-[var(--color-error)]">
          Could not start Stripe Connect onboarding. Try again, or use simulate
          mode for local testing.
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5 sm:p-6">
          <p className="eyebrow text-[var(--color-accent)]">Ledger balance</p>
          <p className="display-title mt-2 text-3xl text-[var(--color-primary)]">
            {formatLedgerAmount(totalCents)}
          </p>
          <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
            {entries.length} entr{entries.length === 1 ? "y" : "ies"} · includes
            credits and past payouts
          </p>
        </div>

        <PayoutActionsPanel
          availableCents={dash.availableCents}
          minCents={dash.minCents}
          payoutsEnabled={dash.payoutsEnabled}
          hasConnectAccount={Boolean(dash.connectAccountId)}
          simulate={dash.simulate}
        />
      </div>

      {dash.payouts.length > 0 ? (
        <section className="mb-8">
          <h2 className="display-title mb-3 text-xl text-[var(--color-primary)]">
            Payout history
          </h2>
          <ul className="space-y-3">
            {dash.payouts.map((p) => (
              <li key={p.id} className="surface-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={payoutPill(p.status)}>
                        {payoutStatusLabel(p.status)}
                      </span>
                      <span className="status-pill status-pill-neutral">
                        {p.mode}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                      {new Date(p.created_at).toLocaleString()}
                      {p.failure_reason ? ` · ${p.failure_reason}` : ""}
                    </p>
                    {p.status === "failed" ? (
                      <Link
                        href="/tutor/earnings?help=payout-failed"
                        className="mt-2 inline-flex text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                      >
                        Support options
                      </Link>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                    {formatLedgerAmount(p.amount_cents)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {error || dash.error ? (
        <p role="alert" className="mb-4 text-sm text-[var(--color-error)]">
          {error ?? dash.error}
        </p>
      ) : null}

      <h2 className="display-title mb-3 text-xl text-[var(--color-primary)]">
        Ledger
      </h2>

      {entries.length === 0 && !error ? (
        <div className="surface-card px-5 py-12 text-center">
          <p className="display-title text-xl text-[var(--color-primary)]">
            No credits yet
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Mark a paid lesson as completed on your calendar, or finish a trial
            summary, to see credits here.
          </p>
          <Link
            href="/tutor/calendar"
            className="btn-panel btn-panel-secondary mt-5"
          >
            Open calendar
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => {
            const positive = entry.amount_cents >= 0;
            return (
              <li key={entry.id} className="surface-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 max-w-xl">
                    <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                      {ledgerEntryKindLabel(entry.entry_kind)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                      {new Date(entry.created_at).toLocaleString()}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </p>
                    {entry.entry_kind === "paid_lesson_earnings" &&
                    entry.gross_cents != null &&
                    entry.commission_cents != null ? (
                      <p className="mt-2 text-xs text-[var(--color-on-surface-muted)]">
                        Lesson price {formatLedgerAmount(entry.gross_cents)} ·
                        platform commission{" "}
                        {formatLedgerAmount(entry.commission_cents)}
                        {entry.commission_bps != null
                          ? ` (${formatCommissionPercent(entry.commission_bps)})`
                          : ""}{" "}
                        · your net {formatLedgerAmount(entry.amount_cents)}
                      </p>
                    ) : null}
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      positive
                        ? "text-[var(--color-success)]"
                        : "text-[var(--color-error)]"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {formatLedgerAmount(entry.amount_cents, entry.currency)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
