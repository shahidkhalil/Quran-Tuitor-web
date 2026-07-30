/**
 * Promote a user to admin by email (Firestore profiles.role).
 *
 * Usage (from project root, with .env.local filled):
 *   npx tsx --env-file=.env.local scripts/promote-admin.ts you@example.com
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in env`);
  return value;
}

function ensureApp() {
  if (getApps().length) return;
  initializeApp({
    credential: cert({
      projectId: required("FIREBASE_ADMIN_PROJECT_ID"),
      clientEmail: required("FIREBASE_ADMIN_CLIENT_EMAIL"),
      privateKey: required("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npx tsx --env-file=.env.local scripts/promote-admin.ts you@example.com");
    process.exit(1);
  }

  ensureApp();
  const auth = getAuth();
  const db = getFirestore();

  const user = await auth.getUserByEmail(email);
  const ref = db.collection("profiles").doc(user.uid);
  const snap = await ref.get();
  const stamp = new Date().toISOString();

  if (snap.exists) {
    await ref.set({ role: "admin", email, updated_at: stamp }, { merge: true });
  } else {
    await ref.set({
      id: user.uid,
      email,
      role: "admin",
      photo_url: null,
      stripe_connect_account_id: null,
      stripe_connect_payouts_enabled: false,
      created_at: stamp,
      updated_at: stamp,
    });
  }

  console.log(`OK: ${email} (${user.uid}) is now role=admin`);
  console.log("Sign out and sign in again, then open http://localhost:3000/admin");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
