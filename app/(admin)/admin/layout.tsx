import { AdminShell } from "@/components/shell/admin-shell";
import { getCurrentProfile } from "@/server/services/profile";

export default async function AdminPagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();

  return (
    <AdminShell email={profile?.email} photoUrl={profile?.photo_url}>
      {children}
    </AdminShell>
  );
}
