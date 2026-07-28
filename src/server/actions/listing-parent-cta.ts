"use server";

import { canShowConversionCta, type TrialBooking } from "@/domain/trials";
import type { PlatformPayment } from "@/domain/payments";
import { COLLECTIONS, db } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";

export type ListingParentCta = {
  href: string;
  label: string;
  subtitle: string;
  /** Visual treatment on the book card */
  kind: "trial" | "paid" | "manage";
};

/**
 * After a free trial (or paid package), tutor profile CTA switches from
 * "Book free trial" to paid / schedule actions for that parent.
 */
export async function getListingParentCta(
  listingId: string,
): Promise<ListingParentCta | null> {
  if (!isAuthConfigured()) return null;
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "parent" && profile.role !== "adult")) {
    return null;
  }

  try {
    const [paySnap, trialSnap] = await Promise.all([
      db()
        .collection(COLLECTIONS.payments)
        .where("parent_id", "==", profile.id)
        .get(),
      db()
        .collection(COLLECTIONS.trialBookings)
        .where("parent_id", "==", profile.id)
        .get(),
    ]);

    const payments = paySnap.docs
      .map((d) => d.data() as PlatformPayment)
      .filter((p) => p.listing_id === listingId && p.status === "paid")
      .sort((a, b) =>
        (b.paid_at ?? b.created_at).localeCompare(a.paid_at ?? a.created_at),
      );

    const paid = payments[0];
    if (paid) {
      if (paid.recurring_booking_id) {
        return {
          href: "/parent/schedule",
          label: "View schedule",
          subtitle: "Your paid package is scheduled",
          kind: "manage",
        };
      }
      return {
        href: `/parent/schedule?payment_id=${encodeURIComponent(paid.id)}`,
        label: "Set weekly schedule",
        subtitle: "Package paid — pick your weekly time",
        kind: "paid",
      };
    }

    const trials = trialSnap.docs
      .map((d) => d.data() as TrialBooking)
      .filter((t) => t.listing_id === listingId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    const convertible = trials.find((t) => canShowConversionCta(t));
    if (convertible) {
      return {
        href: `/parent/checkout?from_trial=${encodeURIComponent(convertible.id)}`,
        label: "Continue to paid lessons",
        subtitle: "Free trial done · book a 4-lesson package",
        kind: "paid",
      };
    }

    const active = trials.find(
      (t) => t.status === "pending_tutor" || t.status === "accepted",
    );
    if (active) {
      return {
        href: "/parent/bookings",
        label: "View your free trial",
        subtitle:
          active.status === "pending_tutor"
            ? "Waiting for tutor to accept"
            : "Trial booked · join from Bookings",
        kind: "manage",
      };
    }
  } catch {
    return null;
  }

  return null;
}
