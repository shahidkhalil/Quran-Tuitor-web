import { db, nowIso } from "@/lib/firebase/db";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";

/** Shared notify helper (safe for cron scripts + server actions). */
export async function notifyUser(input: {
  userId: string;
  title: string;
  body: string;
  link?: string | null;
}) {
  if (!isFirebaseAdminConfigured()) return;

  const ref = db().collection("notifications").doc();
  await ref.set({
    id: ref.id,
    user_id: input.userId,
    title: input.title,
    body: input.body,
    link: input.link ?? null,
    read_at: null,
    created_at: nowIso(),
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const profileSnap = await db().collection("profiles").doc(input.userId).get();
  const profileEmail = profileSnap.data()?.email as string | undefined;
  if (!profileEmail) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Quran Tutor Marketplace <onboarding@resend.dev>",
        to: [profileEmail],
        subject: input.title,
        text: `${input.body}${input.link ? `\n\n${input.link}` : ""}`,
      }),
    });
  } catch (err) {
    console.error("[notify email]", err);
  }
}
