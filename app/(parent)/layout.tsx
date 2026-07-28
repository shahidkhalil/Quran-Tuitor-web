import { requireRoles } from "@/server/guards/require-role";

export default async function ParentSegmentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRoles(["parent", "adult"], "/parent");
  return children;
}
