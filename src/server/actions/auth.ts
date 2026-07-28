"use server";

import { homePathForRole } from "@/domain/roles";
import { db, nowIso } from "@/lib/firebase/db";
import {
  clearSessionCookie,
  getRoleForUid,
  isAuthConfigured,
  setSessionCookie,
} from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type SignUpState = {
  error?: string;
  success?: boolean;
};

export type SignInState = {
  error?: string;
};

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("configuration_not_found") ||
    lower.includes("operation_not_allowed")
  ) {
    return "Firebase Authentication is not enabled. In Firebase Console → Authentication → Get started, then enable Email/Password.";
  }
  if (lower.includes("email_exists") || lower.includes("already") || lower.includes("registered")) {
    return "An account with this email may already exist. Try signing in or use a different email.";
  }
  if (lower.includes("weak_password") || lower.includes("password")) {
    return "Password does not meet requirements. Use at least 8 characters.";
  }
  if (lower.includes("invalid_email") || lower.includes("email")) {
    return "Please enter a valid email address.";
  }
  if (lower.includes("too_many") || lower.includes("rate")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  console.error("[auth]", message);
  return "We could not create your account. Please check your details and try again.";
}

function getFirebaseApiKey() {
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
  return key;
}

async function firebaseAuthRequest<T>(
  path: string,
  payload: Record<string, unknown>,
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/${path}?key=${getFirebaseApiKey()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = (await response.json()) as
      | T
      | { error?: { message?: string } };
    if (!response.ok) {
      const message =
        (json as { error?: { message?: string } }).error?.message ??
        "Authentication failed";
      return { error: message };
    }
    return { data: json as T };
  } catch {
    return { error: "Authentication service unavailable. Please try again." };
  }
}

async function upsertProfile(input: {
  uid: string;
  email: string | null;
  role: "parent" | "adult" | "tutor_applicant" | "tutor" | "admin";
}) {
  const ref = db().collection("profiles").doc(input.uid);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.set(
      {
        email: input.email,
        role: snap.data()?.role ?? input.role,
        updated_at: nowIso(),
      },
      { merge: true },
    );
    return;
  }
  await ref.set({
    id: input.uid,
    email: input.email,
    role: input.role,
    created_at: nowIso(),
    updated_at: nowIso(),
  });
}

export async function signUp(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  if (!isAuthConfigured()) {
    return {
      error:
        "Firebase is not configured. Add Firebase env vars to .env.local (see .env.example).",
    };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const accountType = String(formData.get("accountType") ?? "parent");
  const role =
    accountType === "tutor"
      ? "tutor_applicant"
      : accountType === "adult"
        ? "adult"
        : "parent";

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const signUpResult = await firebaseAuthRequest<{
    idToken: string;
    localId: string;
    email: string;
  }>("accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });

  if (signUpResult.error || !signUpResult.data) {
    return { error: mapAuthError(signUpResult.error ?? "signup failed") };
  }

  try {
    await upsertProfile({
      uid: signUpResult.data.localId,
      email: signUpResult.data.email,
      role,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[signUp] upsertProfile", message);
    if (message.includes("NOT_FOUND") || message.includes("5 ")) {
      return {
        error:
          "Firestore is not created yet. In Firebase Console → Build → Firestore Database → Create database (start in production mode).",
      };
    }
    return {
      error: "Account was created in Auth, but saving your profile failed. Try signing in.",
    };
  }

  await firebaseAuthRequest("accounts:sendOobCode", {
    requestType: "VERIFY_EMAIL",
    idToken: signUpResult.data.idToken,
    continueUrl: `${origin}/auth/confirm`,
  });

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  if (!isAuthConfigured()) {
    return {
      error:
        "Firebase is not configured. Add Firebase env vars to .env.local (see .env.example).",
    };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const signInResult = await firebaseAuthRequest<{
    idToken: string;
    localId: string;
    email: string;
  }>("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
  if (signInResult.error || !signInResult.data) {
    return {
      error: "Invalid email or password. If you just registered, verify your email first.",
    };
  }
  await setSessionCookie(signInResult.data.idToken);
  const existingRole = await getRoleForUid(signInResult.data.localId);
  await upsertProfile({
    uid: signInResult.data.localId,
    email: signInResult.data.email,
    role: existingRole,
  });

  const profile = await getCurrentProfile();
  const next = String(formData.get("next") ?? "").trim();
  if (next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect(homePathForRole(profile?.role));
}

export async function signOut() {
  await clearSessionCookie();
  redirect("/sign-in");
}

export type ForgotPasswordState = {
  error?: string;
  success?: boolean;
};

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  if (!isAuthConfigured()) {
    return {
      error:
        "Firebase is not configured. Add Firebase env vars to .env.local.",
    };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  const result = await firebaseAuthRequest("accounts:sendOobCode", {
    requestType: "PASSWORD_RESET",
    email,
  });

  if (result.error) {
    return {
      error: "We could not send a reset email. Please try again shortly.",
    };
  }

  // Same message whether or not the email exists (avoid account enumeration)
  return { success: true };
}

export type ResetPasswordState = {
  error?: string;
};

export async function updatePassword(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  if (!isAuthConfigured()) {
    return { error: "Firebase is not configured." };
  }

  const oobCode = String(formData.get("oobCode") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (!oobCode) {
    return { error: "Reset link expired or missing. Request a new reset email." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const resetResult = await firebaseAuthRequest<{
    email: string;
  }>("accounts:resetPassword", {
    oobCode,
    newPassword: password,
  });
  if (resetResult.error || !resetResult.data?.email) {
    return { error: "Reset link expired or invalid. Request a new one." };
  }

  const signInResult = await firebaseAuthRequest<{
    idToken: string;
    localId: string;
  }>("accounts:signInWithPassword", {
    email: resetResult.data.email,
    password,
    returnSecureToken: true,
  });
  if (signInResult.error || !signInResult.data) {
    return { error: "Password updated, but auto sign-in failed. Please sign in." };
  }
  await setSessionCookie(signInResult.data.idToken);
  const role = await getRoleForUid(signInResult.data.localId);
  redirect(homePathForRole(role));
}
