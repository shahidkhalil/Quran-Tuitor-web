"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canTutorAcceptNewBookings,
  defaultPublicMessage,
  enforcementActionLabel,
  isEnforcementAction,
  readEnforcement,
  statusAfterAction,
  type EnforcementAction,
  type TutorEnforcementEvent,
  type TutorEnforcementState,
} from "@/domain/tutor-enforcement";
import type { TutorListing } from "@/domain/tutor-listings";
import { COLLECTIONS, db, docId, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { createInAppNotification } from "@/server/actions/notifications";
import { getCurrentProfile } from "@/server/services/profile";

export type EnforcementFormState = {
  error?: string;
  fieldErrors?: {
    action?: string;
    reason?: string;
  };
};

export type AdminTutorRow = {
  tutorId: string;
  email: string | null;
  headline: string | null;
  published: boolean;
  enforcement: TutorEnforcementState;
};

async function requireAdmin() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { ok: false as const, error: "Admin only." };
  }
  return { ok: true as const, profile };
}

async function writeAudit(input: {
  actorId: string;
  action: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  await db().collection(COLLECTIONS.auditLog).add({
    id: db().collection(COLLECTIONS.auditLog).doc().id,
    actor_id: input.actorId,
    action: input.action,
    entity_type: "tutor_enforcement",
    entity_id: input.entityId,
    before_state: input.before,
    after_state: input.after,
    created_at: nowIso(),
  });
}

export async function getTutorEnforcement(
  tutorId: string,
): Promise<TutorEnforcementState> {
  const snap = await db().collection(COLLECTIONS.profiles).doc(tutorId).get();
  return readEnforcement(
    snap.exists ? (snap.data() as Partial<TutorEnforcementState>) : null,
  );
}

/** Blocks new trials / paid checkout / accepting trials when suspended or unlisted. */
export async function assertTutorCanAcceptNewBookings(
  tutorId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const enforcement = await getTutorEnforcement(tutorId);
  if (canTutorAcceptNewBookings(enforcement.enforcement_status)) {
    return { ok: true };
  }
  return {
    ok: false,
    error:
      enforcement.enforcement_public_message?.trim() ||
      "This tutor is not available for new bookings right now.",
  };
}

export async function listTutorsForAdminEnforcement(): Promise<{
  tutors: AdminTutorRow[];
  error?: string;
}> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return { tutors: [], error: ctx.error };

  try {
    const [profilesSnap, listingsSnap] = await Promise.all([
      db().collection(COLLECTIONS.profiles).where("role", "==", "tutor").get(),
      db().collection(COLLECTIONS.tutorListings).get(),
    ]);

    const listings = new Map(
      listingsSnap.docs.map((d) => {
        const data = d.data() as TutorListing;
        return [d.id, data] as const;
      }),
    );

    const tutors: AdminTutorRow[] = profilesSnap.docs.map((d) => {
      const data = d.data() as {
        email?: string | null;
      } & Partial<TutorEnforcementState>;
      const listing = listings.get(d.id);
      return {
        tutorId: d.id,
        email: data.email ?? null,
        headline: listing?.headline ?? null,
        published: Boolean(listing?.published),
        enforcement: readEnforcement(data),
      };
    });

    tutors.sort((a, b) => {
      const ae = a.email ?? a.tutorId;
      const be = b.email ?? b.tutorId;
      return ae.localeCompare(be);
    });

    return { tutors };
  } catch {
    return { tutors: [], error: "Could not load tutors." };
  }
}

export async function getTutorForAdminEnforcement(tutorId: string): Promise<{
  tutor: AdminTutorRow | null;
  events: TutorEnforcementEvent[];
  error?: string;
}> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return { tutor: null, events: [], error: ctx.error };

  const profileSnap = await db()
    .collection(COLLECTIONS.profiles)
    .doc(tutorId)
    .get();
  if (!profileSnap.exists) {
    return { tutor: null, events: [], error: "Tutor not found." };
  }
  const profile = profileSnap.data() as {
    email?: string | null;
    role?: string;
  } & Partial<TutorEnforcementState>;
  if (profile.role !== "tutor" && profile.role !== "tutor_applicant") {
    return { tutor: null, events: [], error: "Not a tutor account." };
  }

  const listingSnap = await db()
    .collection(COLLECTIONS.tutorListings)
    .doc(tutorId)
    .get();
  const listing = listingSnap.exists
    ? (listingSnap.data() as TutorListing)
    : null;

  let events: TutorEnforcementEvent[] = [];
  try {
    const evSnap = await db()
      .collection(COLLECTIONS.tutorEnforcementEvents)
      .where("tutor_id", "==", tutorId)
      .get();
    events = evSnap.docs
      .map((d) => ({ ...(d.data() as TutorEnforcementEvent), id: d.id }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch {
    events = [];
  }

  return {
    tutor: {
      tutorId,
      email: profile.email ?? null,
      headline: listing?.headline ?? null,
      published: Boolean(listing?.published),
      enforcement: readEnforcement(profile),
    },
    events,
  };
}

export async function applyTutorEnforcement(
  _prev: EnforcementFormState,
  formData: FormData,
): Promise<EnforcementFormState> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return { error: ctx.error };

  const tutorId = String(formData.get("tutorId") ?? "").trim();
  const actionRaw = String(formData.get("action") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const publicMessageRaw = String(formData.get("publicMessage") ?? "").trim();

  if (!tutorId) return { error: "Missing tutor id." };
  if (!isEnforcementAction(actionRaw)) {
    return { fieldErrors: { action: "Choose an action." } };
  }
  if (reason.length < 8) {
    return {
      fieldErrors: {
        reason: "Add an internal reason (at least 8 characters).",
      },
    };
  }

  const action = actionRaw as EnforcementAction;
  const profileRef = db().collection(COLLECTIONS.profiles).doc(tutorId);
  const profileSnap = await profileRef.get();
  if (!profileSnap.exists) return { error: "Tutor profile not found." };

  const before = readEnforcement(
    profileSnap.data() as Partial<TutorEnforcementState>,
  );
  const statusAfter = statusAfterAction(action);
  const publicMessage =
    action === "clear"
      ? null
      : publicMessageRaw || defaultPublicMessage(action);
  const stamp = nowIso();

  const after: TutorEnforcementState = {
    enforcement_status: statusAfter,
    enforcement_public_message: publicMessage,
    enforcement_internal_reason: reason,
    enforcement_updated_at: stamp,
    enforcement_updated_by: ctx.profile.id,
  };

  const listingRef = db().collection(COLLECTIONS.tutorListings).doc(tutorId);
  const listingSnap = await listingRef.get();
  const shouldUnpublish = action === "suspend" || action === "unlist";

  const batch = db().batch();
  batch.set(profileRef, { ...after, updated_at: stamp }, { merge: true });

  if (listingSnap.exists && shouldUnpublish) {
    batch.set(
      listingRef,
      {
        published: false,
        published_at: null,
        updated_at: stamp,
      },
      { merge: true },
    );
  }

  const eventId = docId();
  const event: TutorEnforcementEvent = {
    id: eventId,
    tutor_id: tutorId,
    action,
    status_after: statusAfter,
    internal_reason: reason,
    public_message: publicMessage,
    actor_id: ctx.profile.id,
    created_at: stamp,
  };
  batch.set(
    db().collection(COLLECTIONS.tutorEnforcementEvents).doc(eventId),
    event,
  );

  try {
    await batch.commit();
    await writeAudit({
      actorId: ctx.profile.id,
      action: `tutor_${action}`,
      entityId: tutorId,
      before: {
        status: before.enforcement_status,
        reason: before.enforcement_internal_reason,
      },
      after: {
        status: after.enforcement_status,
        reason: after.enforcement_internal_reason,
        public_message: after.enforcement_public_message,
        unpublished: shouldUnpublish,
      },
    });
  } catch {
    return { error: "Could not apply enforcement. Please try again." };
  }

  const tutorNotify =
    action === "clear"
      ? {
          title: "Account reinstated",
          body: "Your listing access was restored. You can publish and accept bookings again when eligible.",
        }
      : action === "warn"
        ? {
            title: "Policy warning",
            body: "You received a policy warning from the platform. Review your listing and teaching conduct. Details are available to support only.",
          }
        : action === "suspend"
          ? {
              title: "Account suspended",
              body:
                publicMessage ||
                "Your account is suspended from new bookings. Existing scheduled lessons may still apply — contact support in-platform.",
            }
          : {
              title: "Listing unlisted",
              body:
                publicMessage ||
                "Your listing was removed from public browse. You cannot accept new bookings until reinstated.",
            };

  await createInAppNotification({
    userId: tutorId,
    title: tutorNotify.title,
    body: tutorNotify.body,
    link: "/tutor/account",
  });

  revalidatePath("/admin/tutors");
  revalidatePath(`/admin/tutors/${tutorId}`);
  revalidatePath("/browse");
  revalidatePath(`/browse/${tutorId}`);
  revalidatePath("/tutor");
  revalidatePath("/tutor/listing");
  revalidatePath("/tutor/account");
  redirect(
    `/admin/tutors/${tutorId}?applied=${encodeURIComponent(action)}`,
  );
}
