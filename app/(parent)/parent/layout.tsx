import { NotificationBellHost } from "@/components/notifications/notification-bell-host";
import { ParentShell } from "@/components/shell/parent-shell";
import { listMyMessageThreads } from "@/server/actions/messages";
import { getCurrentProfile } from "@/server/services/profile";

export default async function ParentShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();
  const { threads } = profile
    ? await listMyMessageThreads()
    : { threads: [] };

  return (
    <ParentShell
      email={profile?.email}
      photoUrl={profile?.photo_url}
      notificationBell={<NotificationBellHost />}
      messageCount={threads.length}
    >
      {children}
    </ParentShell>
  );
}
