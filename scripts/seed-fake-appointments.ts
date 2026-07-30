/**
 * Replace prior fake seeds with 10 appointments on August 3, 2026.
 * Usage: npx tsx --env-file=.env.local scripts/seed-fake-appointments.ts
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

const SEED_TAG = "fake-appointments-aug3-x10";

const FAKE_ON_AUG3 = [
  { name: "Aisha Demo", hour: 8, minute: 0, status: "scheduled" as const },
  { name: "Yusuf Demo", hour: 9, minute: 0, status: "scheduled" as const },
  { name: "Fatima Demo", hour: 10, minute: 0, status: "scheduled" as const },
  { name: "Omar Seed", hour: 11, minute: 0, status: "scheduled" as const },
  { name: "Hana Seed", hour: 12, minute: 0, status: "scheduled" as const },
  { name: "Zayd Seed", hour: 13, minute: 0, status: "scheduled" as const },
  { name: "Noor Seed", hour: 14, minute: 0, status: "scheduled" as const },
  { name: "Ibrahim Seed", hour: 15, minute: 0, status: "scheduled" as const },
  { name: "Maryam Seed", hour: 16, minute: 0, status: "scheduled" as const },
  { name: "Hassan Seed", hour: 17, minute: 0, status: "scheduled" as const },
];

function localSlotIso(dateYmd: string, hour: number, minute: number) {
  const [y, m, d] = dateYmd.split("-").map(Number);
  const start = new Date(y!, (m ?? 1) - 1, d ?? 1, hour, minute, 0, 0);
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function main() {
  ensureApp();
  const db = getFirestore();

  // Remove previous demo seeds so counts stay clean
  const oldLessons = await db.collection("scheduled_lessons").get();
  const toDelete = oldLessons.docs.filter((d) => {
    const seed = (d.data() as { _seed?: string })._seed;
    return typeof seed === "string" && seed.startsWith("fake-appointments");
  });
  console.log(`Deleting ${toDelete.length} old fake lessons…`);
  for (const doc of toDelete) {
    const learnerId = (doc.data() as { learner_id?: string }).learner_id;
    await doc.ref.delete();
    if (learnerId) {
      const learner = await db.collection("learner_profiles").doc(learnerId).get();
      const notes = (learner.data() as { notes?: string } | undefined)?.notes ?? "";
      if (notes.includes("Seeded fake learner")) {
        await learner.ref.delete();
      }
    }
  }

  const existing = await db.collection("scheduled_lessons").limit(20).get();
  if (existing.empty) {
    throw new Error("No existing scheduled_lessons — book a real package first.");
  }
  const all = existing.docs.map((d) => ({ id: d.id, ...d.data() }));
  const template =
    all.find((l) =>
      String((l as { slot_start?: string }).slot_start ?? "").startsWith(
        "2026-08-03",
      ),
    ) ??
    all.find((l) =>
      String((l as { slot_start?: string }).slot_start ?? "").startsWith(
        "2026-08",
      ),
    ) ??
    all[0]!;

  const tutorId = String((template as { tutor_id?: string }).tutor_id ?? "");
  const listingId = String(
    (template as { listing_id?: string }).listing_id ?? "",
  );
  const parentId = String((template as { parent_id?: string }).parent_id ?? "");
  const meetingUrl =
    ((template as { meeting_url?: string | null }).meeting_url as
      | string
      | null
      | undefined) ?? null;

  if (!tutorId || !parentId) {
    throw new Error("Template lesson missing tutor_id/parent_id");
  }

  console.log("Using tutor=", tutorId, "parent=", parentId);

  const stamp = new Date().toISOString();
  const dateYmd = "2026-08-03";

  // One true "ongoing" lesson for today so Ongoing filter is correct (0 or 1)
  const now = new Date();
  const todayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const ongoingStart = new Date(now.getTime() - 10 * 60 * 1000);
  const ongoingEnd = new Date(now.getTime() + 35 * 60 * 1000);

  const ongoingLearner = db.collection("learner_profiles").doc();
  await ongoingLearner.set({
    id: ongoingLearner.id,
    parent_id: parentId,
    display_name: "Bilal Ongoing",
    age_band: "8-10",
    notes: "Seeded fake learner for calendar filters demo",
    created_at: stamp,
    updated_at: stamp,
  });
  const ongoingLesson = db.collection("scheduled_lessons").doc();
  await ongoingLesson.set({
    id: ongoingLesson.id,
    recurring_booking_id: `fake_rb_${ongoingLesson.id}`,
    payment_id: `fake_pay_${ongoingLesson.id}`,
    parent_id: parentId,
    tutor_id: tutorId,
    listing_id: listingId,
    learner_id: ongoingLearner.id,
    sequence: 1,
    slot_start: ongoingStart.toISOString(),
    slot_end: ongoingEnd.toISOString(),
    status: "scheduled",
    meeting_url: meetingUrl,
    attendance_record_id: null,
    attendance_marked_at: null,
    progress_note_id: null,
    created_at: stamp,
    updated_at: stamp,
    _seed: SEED_TAG,
  });
  console.log(
    `OK ongoing on ${todayYmd}: Bilal Ongoing (${ongoingLesson.id})`,
  );

  console.log(`Seeding ${FAKE_ON_AUG3.length} lessons on ${dateYmd}…`);
  for (const slot of FAKE_ON_AUG3) {
    const learnerRef = db.collection("learner_profiles").doc();
    await learnerRef.set({
      id: learnerRef.id,
      parent_id: parentId,
      display_name: slot.name,
      age_band: "8-10",
      notes: "Seeded fake learner for calendar filters demo",
      created_at: stamp,
      updated_at: stamp,
    });

    const { start, end } = localSlotIso(dateYmd, slot.hour, slot.minute);
    const lessonRef = db.collection("scheduled_lessons").doc();

    await lessonRef.set({
      id: lessonRef.id,
      recurring_booking_id: `fake_rb_${lessonRef.id}`,
      payment_id: `fake_pay_${lessonRef.id}`,
      parent_id: parentId,
      tutor_id: tutorId,
      listing_id: listingId,
      learner_id: learnerRef.id,
      sequence: 1,
      slot_start: start,
      slot_end: end,
      status: slot.status,
      meeting_url: meetingUrl,
      attendance_record_id: null,
      attendance_marked_at: slot.status === "scheduled" ? null : stamp,
      progress_note_id: null,
      created_at: stamp,
      updated_at: stamp,
      _seed: SEED_TAG,
    });

    console.log(
      `OK: ${dateYmd} ${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")} ${slot.status} — ${slot.name}`,
    );
  }

  console.log(
    "Done. Open Aug 3 with filter All — you should see Shahid’s originals + 10 fakes.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
