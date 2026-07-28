import { AdminLedgerAdjustForm } from "@/components/admin/admin-ledger-adjust-form";
import { AdminPayoutResolveForm } from "@/components/admin/admin-payout-resolve-form";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  formatCommissionPercent,
  resolveCommissionBps,
} from "@/domain/ledger";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

export const metadata = { title: "Ledger" };

export default async function AdminLedgerPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/admin/ledger");
  if (profile.role !== "admin") redirect("/");

  return (
    <>
      <PanelPageHeader
        eyebrow="Finance"
        title="Ledger & payouts"
        description={`Platform commission is ${formatCommissionPercent(resolveCommissionBps())} of parent lesson price. Adjustments and payout resolutions are audited.`}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminLedgerAdjustForm />
        <AdminPayoutResolveForm />
      </div>
    </>
  );
}
