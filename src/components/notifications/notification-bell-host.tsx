import { NotificationBell } from "@/components/notifications/notification-bell";
import { listMyNotifications } from "@/server/actions/notifications";

type Props = {
  tone?: "light" | "dark";
};

export async function NotificationBellHost({ tone = "light" }: Props) {
  const { notifications } = await listMyNotifications();
  return <NotificationBell notifications={notifications} tone={tone} />;
}
