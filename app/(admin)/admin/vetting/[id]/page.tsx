import { ApplicationReview } from "@/components/admin/application-review";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { getApplicationForAdmin } from "@/server/actions/admin-vetting";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const { application } = await getApplicationForAdmin(id);
  return {
    title: application
      ? `Review ${application.full_name}`
      : "Application review",
  };
}

export default async function AdminVettingDetailPage({ params }: Props) {
  const { id } = await params;
  const { application, error } = await getApplicationForAdmin(id);

  if (!application) {
    notFound();
  }

  return (
    <>
      <PanelPageHeader
        eyebrow="Vetting"
        title={application.full_name}
        description="Review credentials, intro, and make a decision."
        actions={
          <Link href="/admin" className="btn-panel btn-panel-secondary">
            ← Queue
          </Link>
        }
      />
      {error ? (
        <p role="alert" className="mb-4 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}
      <ApplicationReview application={application} />
    </>
  );
}
