import { NotificationBellHost } from "@/components/notifications/notification-bell-host";
import { TutorShell } from "@/components/shell/tutor-shell";
import { getCurrentProfile } from "@/server/services/profile";

export default async function TutorPagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();
  const isVerified = profile?.role === "tutor";

  return (
    <TutorShell
      isVerified={isVerified}
      email={profile?.email}
      photoUrl={profile?.photo_url}
      notificationBell={<NotificationBellHost />}
    >
      {children}
    </TutorShell>
  );
}
