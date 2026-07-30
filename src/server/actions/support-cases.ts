"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ScheduledLesson } from "@/domain/recurring-bookings";
import {
  SUPPORT_DESCRIPTION_MAX,
  SUPPORT_DESCRIPTION_MIN,
  isSupportBookingKind,
  isSupportCategory,
  supportBookingKindLabel,
  type SupportBookingKind,
  type SupportBookingOption,
  type SupportCase,
  type SupportCategory,
  type SupportReporterRole,
} from "@/domain/support-cases";
import type { TrialBooking } from "@/domain/trials";
import { formatSlotLabel } from "@/domain/trials";
import { COLLECTIONS, db, docId, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { createInAppNotification } from "@/server/actions/notifications";
import { getCurrentProfile, type Profile } from "@/server/services/profile";

export type CreateSupportCaseState = {
  error?: string;
  fieldErrors?: {
    category?: string;
    booking?: string;
    description?: string;
  };
};

export type SupportCaseListItem = SupportCase & {
  bookingLabel: string;
};

type ActorCtx =
  | { ok: true; profile: Profile; reporterRole: SupportReporterRole; home: string }
  | { ok: false; error: string };

async function requireSupportActor(): Promise<ActorCtx> {
  if (!isAuthConfigured()) {
    return { ok: false, error: "Authentication is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false, error: "Sign in to open a support case." };
  }
  if (profile.role === "parent" || profile.role === "adult") {
    return {
      ok: true,
      profile,
      reporterRole: profile.role,
      home: "/parent/support",
    };
  }
  if (profile.role === "tutor") {
    return {
      ok: true,
      profile,
      reporterRole: "tutor",
      home: "/tutor/support",
    };
  }
  return {
    ok: false,
    error: "Only parents and tutors can open support cases from bookings.",
  };
}

function encodeBookingValue(kind: SupportBookingKind, id: string) {
  return `${kind}:${id}`;
}

function parseBookingValue(raw: string): {
  kind: SupportBookingKind;
  bookingId: string;
} | null {
  const idx = raw.indexOf(":");
  if (idx <= 0) return null;
  const kind = raw.slice(0, idx);
  const bookingId = raw.slice(idx + 1).trim();
  if (!isSupportBookingKind(kind) || !bookingId) return null;
  return { kind, bookingId };
}

async function loadTrial(id: string): Promise<TrialBooking | null> {
  const snap = await db().collection(COLLECTIONS.trialBookings).doc(id).get();
  if (!snap.exists) return null;
  return { ...(snap.data() as TrialBooking), id: snap.id };
}

async function loadLesson(id: string): Promise<ScheduledLesson | null> {
  const snap = await db().collection(COLLECTIONS.scheduledLessons).doc(id).get();
  if (!snap.exists) return null;
  return { ...(snap.data() as ScheduledLesson), id: snap.id };
}

function trialOptionLabel(booking: TrialBooking): string {
  const start = new Date(booking.slot_start);
  const end = new Date(booking.slot_end);
  return `Free trial · ${formatSlotLabel(start, end)}`;
}

function lessonOptionLabel(lesson: ScheduledLesson): string {
  const start = new Date(lesson.slot_start);
  const end = new Date(lesson.slot_end);
  return `Lesson ${lesson.sequence} · ${formatSlotLabel(start, end)}`;
}

function isParty(
  profileId: string,
  role: SupportReporterRole,
  parties: { parent_id: string; tutor_id: string },
): boolean {
  if (role === "tutor") return parties.tutor_id === profileId;
  return parties.parent_id === profileId;
}

async function resolveBookingForActor(
  kind: SupportBookingKind,
  bookingId: string,
  ctx: Extract<ActorCtx, { ok: true }>,
): Promise<
  | {
      ok: true;
      parent_id: string;
      tutor_id: string;
      learner_id: string;
      listing_id: string;
      label: string;
    }
  | { ok: false; error: string }
> {
  if (kind === "trial") {
    const booking = await loadTrial(bookingId);
    if (!booking) return { ok: false, error: "That trial booking was not found." };
    if (!isParty(ctx.profile.id, ctx.reporterRole, booking)) {
      return { ok: false, error: "You can only open a case on your own bookings." };
    }
    return {
      ok: true,
      parent_id: booking.parent_id,
      tutor_id: booking.tutor_id,
      learner_id: booking.learner_id,
      listing_id: booking.listing_id,
      label: trialOptionLabel(booking),
    };
  }

  const lesson = await loadLesson(bookingId);
  if (!lesson) return { ok: false, error: "That paid lesson was not found." };
  if (!isParty(ctx.profile.id, ctx.reporterRole, lesson)) {
    return { ok: false, error: "You can only open a case on your own bookings." };
  }
  return {
    ok: true,
    parent_id: lesson.parent_id,
    tutor_id: lesson.tutor_id,
    learner_id: lesson.learner_id,
    listing_id: lesson.listing_id,
    label: lessonOptionLabel(lesson),
  };
}

export async function listMySupportBookingOptions(): Promise<{
  options: SupportBookingOption[];
  error?: string;
}> {
  const ctx = await requireSupportActor();
  if (!ctx.ok) return { options: [], error: ctx.error };

  try {
    const options: SupportBookingOption[] = [];

    if (ctx.reporterRole === "tutor") {
      const [trials, lessons] = await Promise.all([
        db()
          .collection(COLLECTIONS.trialBookings)
          .where("tutor_id", "==", ctx.profile.id)
          .get(),
        db()
          .collection(COLLECTIONS.scheduledLessons)
          .where("tutor_id", "==", ctx.profile.id)
          .get(),
      ]);

      for (const d of trials.docs) {
        const booking = { ...(d.data() as TrialBooking), id: d.id };
        options.push({
          value: encodeBookingValue("trial", booking.id),
          kind: "trial",
          bookingId: booking.id,
          label: trialOptionLabel(booking),
        });
      }
      for (const d of lessons.docs) {
        const lesson = { ...(d.data() as ScheduledLesson), id: d.id };
        options.push({
          value: encodeBookingValue("lesson", lesson.id),
          kind: "lesson",
          bookingId: lesson.id,
          label: lessonOptionLabel(lesson),
        });
      }
    } else {
      const [trials, lessons] = await Promise.all([
        db()
          .collection(COLLECTIONS.trialBookings)
          .where("parent_id", "==", ctx.profile.id)
          .get(),
        db()
          .collection(COLLECTIONS.scheduledLessons)
          .where("parent_id", "==", ctx.profile.id)
          .get(),
      ]);

      for (const d of trials.docs) {
        const booking = { ...(d.data() as TrialBooking), id: d.id };
        options.push({
          value: encodeBookingValue("trial", booking.id),
          kind: "trial",
          bookingId: booking.id,
          label: trialOptionLabel(booking),
        });
      }
      for (const d of lessons.docs) {
        const lesson = { ...(d.data() as ScheduledLesson), id: d.id };
        options.push({
          value: encodeBookingValue("lesson", lesson.id),
          kind: "lesson",
          bookingId: lesson.id,
          label: lessonOptionLabel(lesson),
        });
      }
    }

    options.sort((a, b) => b.label.localeCompare(a.label));
    return { options };
  } catch {
    return { options: [], error: "Could not load bookings for support." };
  }
}

export async function listMySupportCases(): Promise<{
  cases: SupportCaseListItem[];
  error?: string;
}> {
  const ctx = await requireSupportActor();
  if (!ctx.ok) return { cases: [], error: ctx.error };

  try {
    const snap = await db()
      .collection(COLLECTIONS.supportCases)
      .where("reporter_id", "==", ctx.profile.id)
      .get();

    const raw = snap.docs
      .map((d) => ({ ...(d.data() as SupportCase), id: d.id }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    const cases: SupportCaseListItem[] = await Promise.all(
      raw.map(async (item) => {
        const resolved = await resolveBookingForActor(
          item.booking_kind,
          item.booking_id,
          ctx,
        );
        return {
          ...item,
          bookingLabel: resolved.ok
            ? resolved.label
            : `${supportBookingKindLabel(item.booking_kind)} · ${item.booking_id.slice(0, 8)}`,
        };
      }),
    );

    return { cases };
  } catch {
    return { cases: [], error: "Could not load support cases." };
  }
}

export async function createSupportCase(
  _prev: CreateSupportCaseState,
  formData: FormData,
): Promise<CreateSupportCaseState> {
  const ctx = await requireSupportActor();
  if (!ctx.ok) return { error: ctx.error };

  const categoryRaw = String(formData.get("category") ?? "").trim();
  const bookingRaw = String(formData.get("booking") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const fieldErrors: CreateSupportCaseState["fieldErrors"] = {};

  if (!isSupportCategory(categoryRaw)) {
    fieldErrors.category = "Choose a category.";
  }
  const parsed = parseBookingValue(bookingRaw);
  if (!parsed) {
    fieldErrors.booking = "Select a booking.";
  }
  if (description.length < SUPPORT_DESCRIPTION_MIN) {
    fieldErrors.description = `Please add at least ${SUPPORT_DESCRIPTION_MIN} characters so we can help.`;
  } else if (description.length > SUPPORT_DESCRIPTION_MAX) {
    fieldErrors.description = `Keep the description under ${SUPPORT_DESCRIPTION_MAX} characters.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const category = categoryRaw as SupportCategory;
  const booking = parsed!;

  const resolved = await resolveBookingForActor(
    booking.kind,
    booking.bookingId,
    ctx,
  );
  if (!resolved.ok) {
    return { error: resolved.error, fieldErrors: { booking: resolved.error } };
  }

  const stamp = nowIso();
  const id = docId();
  const record: SupportCase = {
    id,
    reporter_id: ctx.profile.id,
    reporter_role: ctx.reporterRole,
    category,
    booking_kind: booking.kind,
    booking_id: booking.bookingId,
    parent_id: resolved.parent_id,
    tutor_id: resolved.tutor_id,
    learner_id: resolved.learner_id,
    listing_id: resolved.listing_id,
    description,
    status: "open",
    admin_internal_notes: null,
    outcome_note: null,
    rematch_id: null,
    rematch_at: null,
    resolved_at: null,
    closed_at: null,
    last_updated_by: null,
    created_at: stamp,
    updated_at: stamp,
  };

  try {
    await db().collection(COLLECTIONS.supportCases).doc(id).set(record);
  } catch {
    return { error: "Could not open the support case. Please try again." };
  }

  await createInAppNotification({
    userId: ctx.profile.id,
    title: "Support case opened",
    body: "We received your case. Stay here for updates — no need to contact anyone off-platform.",
    link: ctx.home,
  });

  revalidatePath("/parent/support");
  revalidatePath("/tutor/support");
  revalidatePath(ctx.home);
  redirect(`${ctx.home}?opened=1`);
}
