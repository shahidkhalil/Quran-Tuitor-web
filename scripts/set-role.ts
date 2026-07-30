/**
 * Set profile roles by email.
 * Usage: npx tsx --env-file=.env.local scripts/set-role.ts email@x.com admin
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const VALID = [
  "parent",
  "adult",
  "tutor_applicant",
  "tutor",
  "admin",
] as const;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
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

async function setRole(email: string, role: (typeof VALID)[number]) {
  const auth = getAuth();
  const db = getFirestore();
  const user = await auth.getUserByEmail(email);
  const stamp = new Date().toISOString();
  const ref = db.collection("profiles").doc(user.uid);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.set(
      { role, email: email.toLowerCase(), updated_at: stamp },
      { merge: true },
    );
  } else {
    await ref.set({
      id: user.uid,
      email: email.toLowerCase(),
      role,
      photo_url: null,
      stripe_connect_account_id: null,
      stripe_connect_payouts_enabled: false,
      created_at: stamp,
      updated_at: stamp,
    });
  }
  console.log(`OK: ${email} -> ${role} (${user.uid})`);
}

async function main() {
  ensureApp();
  const email = process.argv[2]?.trim().toLowerCase();
  const role = process.argv[3]?.trim() as (typeof VALID)[number] | undefined;
  if (!email || !role || !VALID.includes(role)) {
    console.error(
      `Usage: npx tsx --env-file=.env.local scripts/set-role.ts you@example.com <${VALID.join("|")}>`,
    );
    process.exit(1);
  }
  await setRole(email, role);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
