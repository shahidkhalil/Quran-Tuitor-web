/**
 * Send due lesson reminders (24h + 15m) once.
 * Usage: npx tsx --env-file=.env.local scripts/send-lesson-reminders.ts
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { runLessonReminders } from "../src/server/services/lesson-reminders";

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

async function main() {
  ensureApp();
  const result = await runLessonReminders(new Date());
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
