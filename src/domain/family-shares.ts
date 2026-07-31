/** Co-parent invites — view-only Parental Watch access (additive). */

export const FAMILY_SHARE_STATUSES = [
  "pending",
  "active",
  "revoked",
] as const;

export type FamilyShareStatus = (typeof FAMILY_SHARE_STATUSES)[number];

export type FamilyShare = {
  id: string;
  owner_parent_id: string;
  owner_email: string | null;
  invitee_email: string;
  member_profile_id: string | null;
  status: FamilyShareStatus;
  invite_token: string;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
};

export const FAMILY_INVITE_MAX_PENDING = 5;

export function normalizeInviteEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidInviteEmail(email: string): boolean {
  if (email.length < 5 || email.length > 160) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function familyShareStatusLabel(status: FamilyShareStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "active":
      return "Active";
    case "revoked":
      return "Revoked";
  }
}

export function canAcceptFamilyShare(
  share: Pick<
    FamilyShare,
    "status" | "invitee_email" | "owner_parent_id"
  >,
  viewer: { id: string; email: string | null },
): { ok: true } | { ok: false; error: string } {
  if (share.status !== "pending") {
    return { ok: false, error: "This invite is no longer pending." };
  }
  if (share.owner_parent_id === viewer.id) {
    return { ok: false, error: "You cannot accept your own invite." };
  }
  const email = normalizeInviteEmail(viewer.email ?? "");
  if (!email || email !== share.invitee_email) {
    return {
      ok: false,
      error: "Sign in with the invited email address to accept.",
    };
  }
  return { ok: true };
}

export function canViewSharedWatch(
  share: Pick<FamilyShare, "status" | "member_profile_id" | "owner_parent_id">,
  viewerId: string,
): boolean {
  return (
    share.status === "active" &&
    share.member_profile_id === viewerId &&
    share.owner_parent_id !== viewerId
  );
}
