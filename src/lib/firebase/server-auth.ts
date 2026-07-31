import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/constants";
import type { UserRole } from "@/domain/roles";

export { SESSION_COOKIE_NAME };

export type SessionUser = {
  uid: string;
  email: string | null;
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  );
}

export function isAuthConfigured(): boolean {
  return isFirebaseConfigured() && isFirebaseAdminConfigured();
}

export async function setSessionCookie(idToken: string) {
  const maxAgeMs = 60 * 60 * 24 * 5 * 1000;
  const auth = getAdminAuth();
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: maxAgeMs,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, sessionCookie, {
    maxAge: maxAgeMs / 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isAuthConfigured()) return null;
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(raw, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
    };
  } catch {
    return null;
  }
}

/** Email verification flag from the session cookie (does not change auth flow). */
export async function getSessionEmailVerified(): Promise<boolean | null> {
  if (!isAuthConfigured()) return null;
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(raw, true);
    return Boolean(decoded.email_verified);
  } catch {
    return null;
  }
}

export async function getRoleForUid(uid: string): Promise<UserRole> {
  const snap = await getAdminDb().collection("profiles").doc(uid).get();
  const role = snap.data()?.role as UserRole | undefined;
  if (
    role === "parent" ||
    role === "adult" ||
    role === "tutor_applicant" ||
    role === "tutor" ||
    role === "admin"
  ) {
    return role;
  }
  return "parent";
}
