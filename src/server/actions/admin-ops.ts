"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DEFAULT_COMMISSION_BPS,
  formatCommissionPercent,
  resolveCommissionBps,
} from "@/domain/ledger";
import type { TrialBooking } from "@/domain/trials";
import { trialStatusLabel } from "@/domain/trials";
import type { ScheduledLesson } from "@/domain/recurring-bookings";
import { lessonStatusLabel } from "@/domain/attendance";
import type { TutorListing } from "@/domain/tutor-listings";
import { COLLECTIONS, db, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";

const COMMISSION_DOC_ID = "commission";

export type CommissionConfig = {
  commission_bps: number;
  updated_at: string | null;
  updated_by: string | null;
  source: "firestore" | "env" | "default";
};

export type CommissionFormState = {
  error?: string;
  fieldErrors?: { bps?: string; reason?: string };
};

export type AdminBookingRow = {
  id: string;
  kind: "trial" | "lesson";
  status: string;
  statusLabel: string;
  parentId: string;
  tutorId: string;
  learnerId: string;
  listingId: string;
  when: string;
  updatedAt: string;
};

export type AdminListingRow = {
  id: string;
  tutorId: string;
  headline: string;
  published: boolean;
  rateUsd: number | null;
  updatedAt: string;
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
    entity_type: "platform_config",
    entity_id: input.entityId,
    before_state: input.before,
    after_state: input.after,
    created_at: nowIso(),
  });
}

/** Active commission for earnings — Firestore override, else env, else default. */
export async function getActiveCommissionBps(): Promise<number> {
  try {
    const snap = await db()
      .collection(COLLECTIONS.platformConfig)
      .doc(COMMISSION_DOC_ID)
      .get();
    if (snap.exists) {
      const bps = Number(snap.data()?.commission_bps);
      if (Number.isFinite(bps) && bps >= 0 && bps <= 10000) {
        return Math.round(bps);
      }
    }
  } catch {
    // fall through
  }
  return resolveCommissionBps();
}

export async function getCommissionConfigForAdmin(): Promise<{
  config: CommissionConfig;
  error?: string;
}> {
  const ctx = await requireAdmin();
  if (!ctx.ok) {
    return {
      config: {
        commission_bps: DEFAULT_COMMISSION_BPS,
        updated_at: null,
        updated_by: null,
        source: "default",
      },
      error: ctx.error,
    };
  }

  try {
    const snap = await db()
      .collection(COLLECTIONS.platformConfig)
      .doc(COMMISSION_DOC_ID)
      .get();
    if (snap.exists) {
      const data = snap.data() as {
        commission_bps?: number;
        updated_at?: string;
        updated_by?: string;
      };
      return {
        config: {
          commission_bps: Math.round(Number(data.commission_bps) || DEFAULT_COMMISSION_BPS),
          updated_at: data.updated_at ?? null,
          updated_by: data.updated_by ?? null,
          source: "firestore",
        },
      };
    }
  } catch {
    // fall through
  }

  const envBps = process.env.PLATFORM_COMMISSION_BPS;
  if (envBps != null && envBps.trim() !== "") {
    return {
      config: {
        commission_bps: resolveCommissionBps(envBps),
        updated_at: null,
        updated_by: null,
        source: "env",
      },
    };
  }

  return {
    config: {
      commission_bps: DEFAULT_COMMISSION_BPS,
      updated_at: null,
      updated_by: null,
      source: "default",
    },
  };
}

export async function updateCommissionConfig(
  _prev: CommissionFormState,
  formData: FormData,
): Promise<CommissionFormState> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return { error: ctx.error };

  const bpsRaw = String(formData.get("commissionBps") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const bps = Number(bpsRaw);

  if (!Number.isFinite(bps) || bps < 0 || bps > 10000) {
    return {
      fieldErrors: {
        bps: "Enter commission in basis points from 0–10000 (2500 = 25%).",
      },
    };
  }
  if (reason.length < 8) {
    return {
      fieldErrors: {
        reason: "Add a reason for the audit log (at least 8 characters).",
      },
    };
  }

  const before = await getCommissionConfigForAdmin();
  const stamp = nowIso();
  const nextBps = Math.round(bps);

  try {
    await db()
      .collection(COLLECTIONS.platformConfig)
      .doc(COMMISSION_DOC_ID)
      .set(
        {
          id: COMMISSION_DOC_ID,
          commission_bps: nextBps,
          updated_at: stamp,
          updated_by: ctx.profile.id,
          last_reason: reason,
        },
        { merge: true },
      );

    await writeAudit({
      actorId: ctx.profile.id,
      action: "commission_config_update",
      entityId: COMMISSION_DOC_ID,
      before: {
        commission_bps: before.config.commission_bps,
        source: before.config.source,
      },
      after: {
        commission_bps: nextBps,
        percent: formatCommissionPercent(nextBps),
        reason,
      },
    });
  } catch {
    return { error: "Could not save commission config." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/ledger");
  redirect("/admin/settings?saved=1");
}

export async function listAdminBookingsOverview(): Promise<{
  rows: AdminBookingRow[];
  error?: string;
}> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return { rows: [], error: ctx.error };

  try {
    const [trialsSnap, lessonsSnap] = await Promise.all([
      db().collection(COLLECTIONS.trialBookings).get(),
      db().collection(COLLECTIONS.scheduledLessons).get(),
    ]);

    const trials: AdminBookingRow[] = trialsSnap.docs.map((d) => {
      const t = d.data() as TrialBooking;
      return {
        id: d.id,
        kind: "trial",
        status: t.status,
        statusLabel: trialStatusLabel(t.status),
        parentId: t.parent_id,
        tutorId: t.tutor_id,
        learnerId: t.learner_id,
        listingId: t.listing_id,
        when: t.slot_start,
        updatedAt: t.updated_at,
      };
    });

    const lessons: AdminBookingRow[] = lessonsSnap.docs.map((d) => {
      const l = { ...(d.data() as ScheduledLesson), id: d.id };
      return {
        id: l.id,
        kind: "lesson",
        status: l.status,
        statusLabel: lessonStatusLabel(l.status),
        parentId: l.parent_id,
        tutorId: l.tutor_id,
        learnerId: l.learner_id,
        listingId: l.listing_id,
        when: l.slot_start,
        updatedAt: l.updated_at,
      };
    });

    const rows = [...trials, ...lessons].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
    return { rows: rows.slice(0, 100) };
  } catch {
    return { rows: [], error: "Could not load bookings." };
  }
}

export async function listAdminListingsOverview(): Promise<{
  listings: AdminListingRow[];
  error?: string;
}> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return { listings: [], error: ctx.error };

  try {
    const snap = await db().collection(COLLECTIONS.tutorListings).get();
    const listings = snap.docs
      .map((d) => {
        const l = d.data() as TutorListing;
        return {
          id: d.id,
          tutorId: l.tutor_id,
          headline: l.headline || "(no headline)",
          published: Boolean(l.published),
          rateUsd: l.rate_usd,
          updatedAt: l.updated_at,
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return { listings };
  } catch {
    return { listings: [], error: "Could not load listings." };
  }
}

export async function getAdminOpsSummary(): Promise<{
  pendingApplications: number;
  openCases: number;
  publishedListings: number;
  upcomingLessons: number;
  error?: string;
}> {
  const empty = {
    pendingApplications: 0,
    openCases: 0,
    publishedListings: 0,
    upcomingLessons: 0,
  };
  const ctx = await requireAdmin();
  if (!ctx.ok) return { ...empty, error: ctx.error };

  try {
    const [apps, cases, listings, lessons] = await Promise.all([
      db()
        .collection(COLLECTIONS.tutorApplications)
        .where("status", "==", "pending")
        .get(),
      db().collection(COLLECTIONS.supportCases).get(),
      db()
        .collection(COLLECTIONS.tutorListings)
        .where("published", "==", true)
        .get(),
      db()
        .collection(COLLECTIONS.scheduledLessons)
        .where("status", "==", "scheduled")
        .get(),
    ]);

    const openCases = cases.docs.filter((d) => {
      const s = d.data()?.status;
      return s === "open" || s === "in_progress";
    }).length;

    return {
      pendingApplications: apps.size,
      openCases,
      publishedListings: listings.size,
      upcomingLessons: lessons.size,
    };
  } catch {
    return { ...empty, error: "Could not load ops summary." };
  }
}
