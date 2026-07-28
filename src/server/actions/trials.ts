"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  TRIAL_CURRENCY,
  TRIAL_PARENT_AMOUNT_CENTS,
  TRIAL_TIMEOUT_HOURS,
  buildTrialMeetingUrl,
  canSubmitTrialSummary,
  isTrialExpired,
  proposeTrialSlots,
  slotWithinAvailabilityHint,
  type TrialBooking,
} from "@/domain/trials";
import { COLLECTIONS, db, docId, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { creditTrialStipend } from "@/server/actions/ledger";
import { createInAppNotification } from "@/server/actions/notifications";
import { ensureThreadOnRelationship } from "@/server/actions/messages";
import { getPublishedListingById } from "@/server/actions/tutor-listings";
import { getCurrentProfile } from "@/server/services/profile";
import type { LearnerProfile } from "@/domain/learners";

export type TrialFormState = {
  error?: string;
  fieldErrors?: {
    learnerId?: string;
    slotStart?: string;
  };
};

export type TrialSummaryFormState = {
  error?: string;
  fieldErrors?: {
    summary?: string;
    recommendation?: string;
  };
  success?: boolean;
};

async function requireParentLike() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Please sign in.", needsAuth: true as const };
  }
  if (profile.role !== "parent" && profile.role !== "adult") {
    return {
      ok: false as const,
      error: "Use a parent account to book a free trial.",
    };
  }
  return { ok: true as const, profile };
}

export async function listParentLearnersForTrial(): Promise<{
  learners: LearnerProfile[];
  error?: string;
}> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { learners: [], error: ctx.error };

  try {
    const snap = await db()
      .collection(COLLECTIONS.learnerProfiles)
      .where("parent_id", "==", ctx.profile.id)
      .where("archived_at", "==", null)
      .orderBy("created_at", "asc")
      .get();
    return {
      learners: snap.docs.map((d) => d.data() as LearnerProfile),
    };
  } catch {
    try {
      const snap = await db()
        .collection(COLLECTIONS.learnerProfiles)
        .where("parent_id", "==", ctx.profile.id)
        .get();
      const learners = snap.docs
        .map((d) => d.data() as LearnerProfile)
        .filter((l) => !l.archived_at);
      return { learners };
    } catch {
      return { learners: [], error: "Could not load learners." };
    }
  }
}

export async function getTrialSlotsForListing(listingId: string): Promise<{
  slots: ReturnType<typeof proposeTrialSlots>;
  availabilitySummary: string;
  error?: string;
}> {
  const { listing, error } = await getPublishedListingById(listingId);
  if (!listing) {
    return { slots: [], availabilitySummary: "", error: error ?? "Listing not found." };
  }
  const slots = proposeTrialSlots().filter((s) =>
    slotWithinAvailabilityHint(s.start, listing.availability_summary),
  );
  return { slots, availabilitySummary: listing.availability_summary };
}

export async function bookTrialLesson(
  _prev: TrialFormState,
  formData: FormData,
): Promise<TrialFormState> {
  const listingId = String(formData.get("listingId") ?? "").trim();
  const learnerId = String(formData.get("learnerId") ?? "").trim();
  const slotStart = String(formData.get("slotStart") ?? "").trim();

  const ctx = await requireParentLike();
  if (!ctx.ok) {
    if ("needsAuth" in ctx && ctx.needsAuth) {
      redirect(
        `/sign-in?next=${encodeURIComponent(`/browse/${listingId}/trial`)}`,
      );
    }
    return { error: ctx.error };
  }

  const fieldErrors: TrialFormState["fieldErrors"] = {};
  if (!learnerId) fieldErrors.learnerId = "Select a learner.";
  if (!slotStart) fieldErrors.slotStart = "Pick a trial slot.";
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Please complete the required fields." };
  }

  const { listing } = await getPublishedListingById(listingId);
  if (!listing) {
    return { error: "That tutor listing is not available." };
  }

  const learnerSnap = await db()
    .collection(COLLECTIONS.learnerProfiles)
    .doc(learnerId)
    .get();
  if (!learnerSnap.exists) {
    return {
      fieldErrors: { learnerId: "Learner not found." },
      error: "Choose a valid learner profile.",
    };
  }
  const learner = learnerSnap.data() as LearnerProfile;
  if (learner.parent_id !== ctx.profile.id || learner.archived_at) {
    return {
      fieldErrors: { learnerId: "Learner not found." },
      error: "Choose a valid learner profile.",
    };
  }

  const slots = proposeTrialSlots();
  const slot = slots.find((s) => s.start === slotStart);
  if (!slot) {
    return {
      fieldErrors: { slotStart: "That slot is no longer available." },
      error: "Pick a slot from the list.",
    };
  }

  if (!slotWithinAvailabilityHint(slot.start, listing.availability_summary)) {
    return {
      fieldErrors: { slotStart: "Outside this tutor’s availability." },
      error: "Pick a slot that fits the tutor’s availability.",
    };
  }

  // Prevent double-booking same tutor slot while pending/accepted
  const conflictSnap = await db()
    .collection(COLLECTIONS.trialBookings)
    .where("tutor_id", "==", listing.tutor_id)
    .where("slot_start", "==", slot.start)
    .get();
  const hasConflict = conflictSnap.docs.some((d) => {
    const st = (d.data() as TrialBooking).status;
    return st === "pending_tutor" || st === "accepted";
  });
  if (hasConflict) {
    return {
      fieldErrors: { slotStart: "This slot was just taken." },
      error: "Choose another slot.",
    };
  }

  const stamp = nowIso();
  const expires = new Date(Date.now() + TRIAL_TIMEOUT_HOURS * 60 * 60 * 1000);
  const id = docId();
  const booking: TrialBooking = {
    id,
    parent_id: ctx.profile.id,
    learner_id: learnerId,
    tutor_id: listing.tutor_id,
    listing_id: listing.id,
    slot_start: slot.start,
    slot_end: slot.end,
    status: "pending_tutor",
    parent_amount_cents: TRIAL_PARENT_AMOUNT_CENTS,
    currency: TRIAL_CURRENCY,
    meeting_url: null,
    expires_at: expires.toISOString(),
    created_at: stamp,
    updated_at: stamp,
    responded_at: null,
    summary: null,
    recommendation: null,
    completed_at: null,
  };

  await db().collection(COLLECTIONS.trialBookings).doc(id).set(booking);

  await createInAppNotification({
    userId: listing.tutor_id,
    title: "New free trial request",
    body: `${learner.display_name} requested a free trial. Respond within ${TRIAL_TIMEOUT_HOURS} hours.`,
    link: "/tutor/requests",
  });

  revalidatePath("/parent/bookings");
  revalidatePath("/tutor");
  revalidatePath("/tutor/requests");
  revalidatePath(`/browse/${listingId}`);
  redirect(`/parent/bookings?booked=${id}`);
}

async function requireVerifiedTutor() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Please sign in.", needsAuth: true as const };
  }
  if (profile.role !== "tutor") {
    return {
      ok: false as const,
      error: "Only verified tutors can manage trial requests.",
    };
  }
  return { ok: true as const, profile };
}

async function expireTimedOutTrials(
  bookings: TrialBooking[],
): Promise<TrialBooking[]> {
  const stamp = nowIso();
  const next: TrialBooking[] = [];
  for (const booking of bookings) {
    if (!isTrialExpired(booking)) {
      next.push(booking);
      continue;
    }
    await db().collection(COLLECTIONS.trialBookings).doc(booking.id).set(
      {
        status: "timed_out",
        updated_at: stamp,
        responded_at: stamp,
      },
      { merge: true },
    );
    const timedOut: TrialBooking = {
      ...booking,
      status: "timed_out",
      updated_at: stamp,
      responded_at: stamp,
    };
    next.push(timedOut);
    await createInAppNotification({
      userId: booking.parent_id,
      title: "Trial request timed out",
      body: "The tutor didn’t respond in time. You can book another slot or tutor.",
      link: "/browse",
    });
  }
  return next;
}

export async function listTutorTrialBookings(): Promise<{
  bookings: TrialBooking[];
  error?: string;
}> {
  const ctx = await requireVerifiedTutor();
  if (!ctx.ok) return { bookings: [], error: ctx.error };

  try {
    const snap = await db()
      .collection(COLLECTIONS.trialBookings)
      .where("tutor_id", "==", ctx.profile.id)
      .orderBy("created_at", "desc")
      .get();
    const raw = snap.docs.map((d) => d.data() as TrialBooking);
    const bookings = await expireTimedOutTrials(raw);
    return { bookings };
  } catch {
    try {
      const snap = await db()
        .collection(COLLECTIONS.trialBookings)
        .where("tutor_id", "==", ctx.profile.id)
        .get();
      const raw = snap.docs
        .map((d) => d.data() as TrialBooking)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      const bookings = await expireTimedOutTrials(raw);
      return { bookings };
    } catch {
      return { bookings: [], error: "Could not load trial requests." };
    }
  }
}

export async function acceptTrialRequest(formData: FormData) {
  const id = String(formData.get("bookingId") ?? "").trim();
  const ctx = await requireVerifiedTutor();
  if (!ctx.ok) {
    redirect("/sign-in?next=/tutor/requests");
  }
  if (!id) redirect("/tutor/requests");

  const ref = db().collection(COLLECTIONS.trialBookings).doc(id);
  const snap = await ref.get();
  if (!snap.exists) redirect("/tutor/requests?error=missing");
  let booking = snap.data() as TrialBooking;
  if (booking.tutor_id !== ctx.profile.id) {
    redirect("/tutor/requests?error=forbidden");
  }

  [booking] = await expireTimedOutTrials([booking]);
  if (booking.status !== "pending_tutor") {
    redirect("/tutor/requests?error=closed");
  }

  const stamp = nowIso();
  const meetingUrl = buildTrialMeetingUrl(booking.id);
  await ref.set(
    {
      status: "accepted",
      meeting_url: meetingUrl,
      responded_at: stamp,
      updated_at: stamp,
    },
    { merge: true },
  );

  await createInAppNotification({
    userId: booking.parent_id,
    title: "Trial accepted",
    body: "Your free trial was accepted. Join from Bookings when it’s time.",
    link: "/parent/bookings",
  });

  await ensureThreadOnRelationship({
    parentId: booking.parent_id,
    tutorId: booking.tutor_id,
    learnerId: booking.learner_id,
    source: "trial",
  });

  revalidatePath("/tutor/requests");
  revalidatePath("/parent/bookings");
  revalidatePath("/parent/messages");
  revalidatePath("/tutor/messages");
  redirect("/tutor/requests?accepted=1");
}

export async function declineTrialRequest(formData: FormData) {
  const id = String(formData.get("bookingId") ?? "").trim();
  const ctx = await requireVerifiedTutor();
  if (!ctx.ok) {
    redirect("/sign-in?next=/tutor/requests");
  }
  if (!id) redirect("/tutor/requests");

  const ref = db().collection(COLLECTIONS.trialBookings).doc(id);
  const snap = await ref.get();
  if (!snap.exists) redirect("/tutor/requests?error=missing");
  let booking = snap.data() as TrialBooking;
  if (booking.tutor_id !== ctx.profile.id) {
    redirect("/tutor/requests?error=forbidden");
  }

  [booking] = await expireTimedOutTrials([booking]);
  if (booking.status !== "pending_tutor") {
    redirect("/tutor/requests?error=closed");
  }

  const stamp = nowIso();
  await ref.set(
    {
      status: "declined",
      meeting_url: null,
      responded_at: stamp,
      updated_at: stamp,
    },
    { merge: true },
  );

  await createInAppNotification({
    userId: booking.parent_id,
    title: "Trial declined",
    body: "The tutor declined this free trial. Pick another tutor or slot from Browse.",
    link: "/browse",
  });

  revalidatePath("/tutor/requests");
  revalidatePath("/parent/bookings");
  redirect("/tutor/requests?declined=1");
}

export async function listMyTrialBookings(): Promise<{
  bookings: TrialBooking[];
  error?: string;
}> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { bookings: [], error: ctx.error };

  try {
    const snap = await db()
      .collection(COLLECTIONS.trialBookings)
      .where("parent_id", "==", ctx.profile.id)
      .orderBy("created_at", "desc")
      .get();
    const raw = snap.docs.map((d) => d.data() as TrialBooking);
    return { bookings: await expireTimedOutTrials(raw) };
  } catch {
    try {
      const snap = await db()
        .collection(COLLECTIONS.trialBookings)
        .where("parent_id", "==", ctx.profile.id)
        .get();
      const raw = snap.docs
        .map((d) => d.data() as TrialBooking)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return { bookings: await expireTimedOutTrials(raw) };
    } catch {
      return { bookings: [], error: "Could not load bookings." };
    }
  }
}

export async function getTrialBookingForParent(
  id: string,
): Promise<{ booking: TrialBooking | null; error?: string }> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { booking: null, error: ctx.error };
  const snap = await db().collection(COLLECTIONS.trialBookings).doc(id).get();
  if (!snap.exists) return { booking: null };
  let booking = snap.data() as TrialBooking;
  if (booking.parent_id !== ctx.profile.id) return { booking: null };
  [booking] = await expireTimedOutTrials([booking]);
  return { booking };
}

export async function submitTrialSummary(
  _prev: TrialSummaryFormState,
  formData: FormData,
): Promise<TrialSummaryFormState> {
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const recommendation = String(formData.get("recommendation") ?? "").trim();

  const ctx = await requireVerifiedTutor();
  if (!ctx.ok) {
    if ("needsAuth" in ctx && ctx.needsAuth) {
      redirect("/sign-in?next=/tutor/requests");
    }
    return { error: ctx.error };
  }

  const fieldErrors: TrialSummaryFormState["fieldErrors"] = {};
  if (!summary) fieldErrors.summary = "Write a short lesson summary.";
  if (!recommendation) {
    fieldErrors.recommendation = "Add a recommendation for the parent.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Please complete the summary fields." };
  }
  if (!bookingId) {
    return { error: "Missing booking." };
  }

  const ref = db().collection(COLLECTIONS.trialBookings).doc(bookingId);
  const snap = await ref.get();
  if (!snap.exists) {
    return { error: "Trial booking not found." };
  }
  let booking = snap.data() as TrialBooking;
  if (booking.tutor_id !== ctx.profile.id) {
    return { error: "You can only summarise your own trials." };
  }

  [booking] = await expireTimedOutTrials([booking]);

  if (booking.status === "completed") {
    return { error: "This trial summary was already submitted." };
  }

  if (!canSubmitTrialSummary(booking)) {
    return {
      error:
        booking.status !== "accepted"
          ? "Only accepted trials can be summarised."
          : "You can submit the summary after the scheduled trial end time.",
    };
  }

  const stamp = nowIso();
  await ref.set(
    {
      status: "completed",
      summary,
      recommendation,
      completed_at: stamp,
      updated_at: stamp,
      // Parent amount must remain $0 for trials (FR12).
      parent_amount_cents: TRIAL_PARENT_AMOUNT_CENTS,
    },
    { merge: true },
  );

  const completed: TrialBooking = {
    ...booking,
    status: "completed",
    summary,
    recommendation,
    completed_at: stamp,
    updated_at: stamp,
    parent_amount_cents: TRIAL_PARENT_AMOUNT_CENTS,
  };

  const stipend = await creditTrialStipend(completed);
  if (stipend.error) {
    console.error("[submitTrialSummary stipend]", stipend.error);
  }

  await createInAppNotification({
    userId: booking.parent_id,
    title: "Trial summary ready",
    body: "Your tutor shared a short summary and recommendation. You can continue to paid lessons when ready.",
    link: "/parent/bookings",
  });

  revalidatePath("/tutor/requests");
  revalidatePath("/tutor/earnings");
  revalidatePath("/parent/bookings");
  revalidatePath("/tutor");

  redirect("/tutor/requests?summarised=1");
}
