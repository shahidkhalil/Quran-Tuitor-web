import { requireRoles } from "@/server/guards/require-role";

export default async function AdminSegmentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRoles(["admin"], "/admin");
  return children;
}
