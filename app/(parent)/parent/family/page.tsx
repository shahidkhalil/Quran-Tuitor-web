import Link from "next/link";
import { FamilyInviteForm } from "@/components/family/family-invite-form";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { familyShareStatusLabel } from "@/domain/family-shares";
import {
  listOwnedFamilyShares,
  listSharedWithMe,
  revokeFamilyShare,
} from "@/server/actions/family-shares";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

export const metadata = { title: "Family sharing" };

export default async function ParentFamilyPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/parent/family");

  const [{ shares: owned }, { shares: shared }] = await Promise.all([
    listOwnedFamilyShares(),
    listSharedWithMe(),
  ]);

  const activeOwned = owned.filter((s) => s.status !== "revoked");

  return (
    <>
      <PanelPageHeader
        eyebrow="Family"
        title="Invite a co-parent"
        description="Share view-only Parental Watch with a partner. They cannot book, pay, or message as you."
        actions={
          <Link href="/parent/watch" className="btn-panel btn-panel-secondary">
            Parental Watch
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card space-y-4 p-5 sm:p-6">
          <div>
            <p className="eyebrow text-[var(--color-accent)]">Invite</p>
            <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
              Send a Watch invite
            </h2>
            <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
              They sign in with that email, open the invite link, then see your
              learners’ progress read-only.
            </p>
          </div>
          <FamilyInviteForm />
        </section>

        <section className="surface-card space-y-4 p-5 sm:p-6">
          <div>
            <p className="eyebrow text-[var(--color-accent)]">Your invites</p>
            <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
              People you’ve invited
            </h2>
          </div>
          {activeOwned.length === 0 ? (
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              No invites yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {activeOwned.map((share) => (
                <li
                  key={share.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                      {share.invitee_email}
                    </p>
                    <p className="text-xs text-[var(--color-on-surface-muted)]">
                      {familyShareStatusLabel(share.status)}
                      {share.status === "active" && share.member_profile_id
                        ? " · can view Watch"
                        : null}
                    </p>
                  </div>
                  {share.status !== "revoked" ? (
                    <form action={revokeFamilyShare}>
                      <input type="hidden" name="shareId" value={share.id} />
                      <button
                        type="submit"
                        className="text-xs font-semibold text-[var(--color-on-surface-muted)] underline-offset-2 hover:underline"
                      >
                        Revoke
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 surface-card p-5 sm:p-6">
        <p className="eyebrow text-[var(--color-accent)]">Shared with you</p>
        <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
          Families you can view
        </h2>
        {shared.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-on-surface-muted)]">
            When someone invites you, accepted shares appear here.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {shared.map((share) => (
              <li key={share.id}>
                <Link
                  href={`/parent/watch?family=${encodeURIComponent(share.owner_parent_id)}`}
                  className="surface-card-interactive flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-outline)] px-4 py-3"
                >
                  <span className="text-sm font-semibold text-[var(--color-primary)]">
                    {share.owner_email ?? "Family Watch"}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-on-surface-muted)]">
                    View only →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
