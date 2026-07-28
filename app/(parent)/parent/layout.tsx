import { NotificationBellHost } from "@/components/notifications/notification-bell-host";
import { ParentShell } from "@/components/shell/parent-shell";
import { getCurrentProfile } from "@/server/services/profile";

export default async function ParentShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();

  return (
    <ParentShell
      email={profile?.email}
      photoUrl={profile?.photo_url}
      notificationBell={<NotificationBellHost />}
    >
      {children}
    </ParentShell>
  );
}
