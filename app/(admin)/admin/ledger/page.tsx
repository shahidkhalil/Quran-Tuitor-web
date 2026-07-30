import { AdminLedgerAdjustForm } from "@/components/admin/admin-ledger-adjust-form";
import { AdminPayoutResolveForm } from "@/components/admin/admin-payout-resolve-form";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { formatCommissionPercent } from "@/domain/ledger";
import { getActiveCommissionBps } from "@/server/actions/admin-ops";
import { getCurrentProfile } from "@/server/services/profile";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Ledger" };

export default async function AdminLedgerPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/admin/ledger");
  if (profile.role !== "admin") redirect("/");

  const commissionBps = await getActiveCommissionBps();

  return (
    <>
      <PanelPageHeader
        eyebrow="Finance"
        title="Ledger & payouts"
        description={`Platform commission is ${formatCommissionPercent(commissionBps)} of parent lesson price. Adjustments and payout resolutions are audited.`}
        actions={
          <Link href="/admin/settings" className="btn-panel btn-panel-secondary">
            Commission settings
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminLedgerAdjustForm />
        <AdminPayoutResolveForm />
      </div>
    </>
  );
}
