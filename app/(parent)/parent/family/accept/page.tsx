import Link from "next/link";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { canAcceptFamilyShare } from "@/domain/family-shares";
import {
  acceptFamilyInvite,
  getFamilyInviteByToken,
} from "@/server/actions/family-shares";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

export const metadata = { title: "Accept family invite" };

type Props = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function AcceptFamilyInvitePage({ searchParams }: Props) {
  const { token, error } = await searchParams;
  const profile = await getCurrentProfile();

  if (!token?.trim()) {
    return (
      <>
        <PanelPageHeader
          eyebrow="Family"
          title="Invite link missing"
          description="Ask the parent to send a fresh invite from Family sharing."
        />
        <Link href="/parent/family" className="btn-panel btn-panel-primary">
          Family sharing
        </Link>
      </>
    );
  }

  if (!profile) {
    redirect(
      `/sign-in?next=${encodeURIComponent(`/parent/family/accept?token=${token}`)}`,
    );
  }

  const { share, error: loadError } = await getFamilyInviteByToken(token);
  if (!share || loadError) {
    return (
      <>
        <PanelPageHeader
          eyebrow="Family"
          title="Invite not found"
          description={loadError ?? "This link may have expired or been revoked."}
        />
        <Link href="/parent" className="btn-panel btn-panel-secondary">
          Home
        </Link>
      </>
    );
  }

  const gate = canAcceptFamilyShare(share, {
    id: profile.id,
    email: profile.email,
  });

  return (
    <>
      <PanelPageHeader
        eyebrow="Family"
        title="Accept Watch invite"
        description="You’ll get view-only access to Parental Watch — no booking or payments on their account."
      />

      <div className="surface-card max-w-lg space-y-4 p-5 sm:p-6">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--color-on-surface-muted)]">From</dt>
            <dd className="font-semibold">
              {share.owner_email ?? "A parent"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--color-on-surface-muted)]">Invited as</dt>
            <dd className="font-semibold">{share.invitee_email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--color-on-surface-muted)]">Signed in as</dt>
            <dd className="font-semibold">{profile.email ?? "—"}</dd>
          </div>
        </dl>

        {error || !gate.ok ? (
          <p role="alert" className="text-sm text-[var(--color-error)]">
            {error ?? (!gate.ok ? gate.error : null)}
          </p>
        ) : null}

        {share.status === "active" ? (
          <Link
            href={`/parent/watch?family=${encodeURIComponent(share.owner_parent_id)}`}
            className="btn-panel btn-panel-primary inline-flex"
          >
            Open shared Watch
          </Link>
        ) : gate.ok ? (
          <form action={acceptFamilyInvite}>
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="btn-panel btn-panel-primary">
              Accept view-only access
            </button>
          </form>
        ) : (
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            Sign in with <strong>{share.invitee_email}</strong> to accept this
            invite.
          </p>
        )}
      </div>
    </>
  );
}
