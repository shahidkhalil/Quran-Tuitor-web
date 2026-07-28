import { AccountWorkspace } from "@/components/account/account-workspace";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

export const metadata = { title: "Account" };

export default async function AdminAccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/admin/account");
  if (profile.role !== "admin") redirect("/");

  return (
    <>
      <PanelPageHeader
        eyebrow="Settings"
        title="Admin account"
        description="Signed-in identity and profile photo for the operations console."
      />

      <AccountWorkspace
        email={profile.email}
        photoUrl={profile.photo_url}
        roleLabel="Admin"
        badge="Privileged"
        safetyNote="Admin actions that change applications, listings, or ledger are audited."
        shortcuts={[
          {
            href: "/admin",
            title: "Dashboard",
            body: "Operations overview",
            icon: "D",
          },
          {
            href: "/admin/vetting",
            title: "Vetting",
            body: "Tutor application queue",
            icon: "V",
          },
          {
            href: "/admin/ledger",
            title: "Ledger",
            body: "Earnings and payouts",
            icon: "£",
          },
        ]}
      />
    </>
  );
}
