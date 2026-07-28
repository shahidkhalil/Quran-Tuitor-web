import { requireRoles } from "@/server/guards/require-role";

export default async function TutorSegmentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRoles(["tutor_applicant", "tutor"], "/tutor");
  return children;
}
