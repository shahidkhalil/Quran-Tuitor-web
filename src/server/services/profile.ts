import { db, nowIso } from "@/lib/firebase/db";
import { getSessionUser as getFirebaseSessionUser } from "@/lib/firebase/server-auth";
import type { UserRole } from "@/domain/roles";

export type Profile = {
  id: string;
  email: string | null;
  role: UserRole;
  photo_url: string | null;
  stripe_connect_account_id: string | null;
  stripe_connect_payouts_enabled: boolean;
};

const VALID_ROLES: UserRole[] = [
  "parent",
  "adult",
  "tutor_applicant",
  "tutor",
  "admin",
];

function normalizeRole(raw: string | undefined | null): UserRole {
  if (raw && VALID_ROLES.includes(raw as UserRole)) {
    return raw as UserRole;
  }
  return "parent";
}

function toProfile(
  uid: string,
  email: string | null,
  data: {
    email?: string | null;
    role?: string;
    photo_url?: string | null;
    stripe_connect_account_id?: string | null;
    stripe_connect_payouts_enabled?: boolean;
  },
): Profile {
  return {
    id: uid,
    email: (data.email ?? email) ?? null,
    role: normalizeRole(data.role),
    photo_url: data.photo_url ?? null,
    stripe_connect_account_id: data.stripe_connect_account_id ?? null,
    stripe_connect_payouts_enabled: Boolean(
      data.stripe_connect_payouts_enabled,
    ),
  };
}

export async function getSessionUser() {
  return getFirebaseSessionUser();
}

/** Ensure a profiles row exists (needed for FKs like learner_profiles.parent_id). */
export async function ensureProfile(): Promise<Profile | null> {
  const user = await getFirebaseSessionUser();
  if (!user) return null;

  const profileRef = db().collection("profiles").doc(user.uid);
  const snap = await profileRef.get();
  const data = snap.data() as
    | {
        email?: string | null;
        role?: string;
        photo_url?: string | null;
        stripe_connect_account_id?: string | null;
        stripe_connect_payouts_enabled?: boolean;
      }
    | undefined;
  if (data) {
    return toProfile(user.uid, user.email, data);
  }

  const role = "parent";
  await profileRef.set({
    id: user.uid,
    email: user.email ?? null,
    role,
    photo_url: null,
    stripe_connect_account_id: null,
    stripe_connect_payouts_enabled: false,
    created_at: nowIso(),
    updated_at: nowIso(),
  });

  return {
    id: user.uid,
    email: user.email ?? null,
    role,
    photo_url: null,
    stripe_connect_account_id: null,
    stripe_connect_payouts_enabled: false,
  };
}

export async function getCurrentProfile(): Promise<Profile | null> {
  return ensureProfile();
}

export async function getProfilePhotoUrl(
  userId: string,
): Promise<string | null> {
  const snap = await db().collection("profiles").doc(userId).get();
  if (!snap.exists) return null;
  return (snap.data()?.photo_url as string | null | undefined) ?? null;
}
