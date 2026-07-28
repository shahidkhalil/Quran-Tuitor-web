"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  SHORTLIST_MAX,
  shortlistDocId,
  type ShortlistItem,
} from "@/domain/shortlist";
import { COLLECTIONS, db, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import {
  getPublishedListingById,
  listPublishedListings,
} from "@/server/actions/tutor-listings";
import { getCurrentProfile } from "@/server/services/profile";
import type { TutorListing } from "@/domain/tutor-listings";

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
      error: "Shortlist is available on parent accounts.",
    };
  }
  return { ok: true as const, profile };
}

export async function getMyShortlistIds(): Promise<{
  ids: string[];
  error?: string;
}> {
  const ctx = await requireParentLike();
  if (!ctx.ok) {
    return { ids: [], error: ctx.error };
  }

  const snap = await db()
    .collection(COLLECTIONS.shortlistItems)
    .where("parent_id", "==", ctx.profile.id)
    .orderBy("created_at", "desc")
    .get()
    .catch(async () =>
      db()
        .collection(COLLECTIONS.shortlistItems)
        .where("parent_id", "==", ctx.profile.id)
        .get(),
    );

  const ids = snap.docs.map((d) => (d.data() as ShortlistItem).listing_id);
  return { ids };
}

export async function getMyShortlistListings(): Promise<{
  listings: TutorListing[];
  error?: string;
}> {
  const { ids, error } = await getMyShortlistIds();
  if (error && ids.length === 0) {
    return { listings: [], error };
  }
  if (ids.length === 0) return { listings: [] };

  const { listings: all } = await listPublishedListings();
  const byId = new Map(all.map((l) => [l.id, l]));
  const listings = ids
    .map((id) => byId.get(id))
    .filter((l): l is TutorListing => Boolean(l));
  return { listings };
}

export async function addToShortlist(listingId: string): Promise<{
  ok: boolean;
  error?: string;
  needsAuth?: boolean;
}> {
  const ctx = await requireParentLike();
  if (!ctx.ok) {
    return {
      ok: false,
      error: ctx.error,
      needsAuth: "needsAuth" in ctx ? ctx.needsAuth : false,
    };
  }

  const { listing } = await getPublishedListingById(listingId);
  if (!listing) {
    return { ok: false, error: "That tutor listing is not available." };
  }

  const { ids } = await getMyShortlistIds();
  if (ids.includes(listingId)) {
    return { ok: true };
  }
  if (ids.length >= SHORTLIST_MAX) {
    return {
      ok: false,
      error: `Shortlist is full (max ${SHORTLIST_MAX}). Remove one to add another.`,
    };
  }

  const id = shortlistDocId(ctx.profile.id, listingId);
  const item: ShortlistItem = {
    id,
    parent_id: ctx.profile.id,
    listing_id: listingId,
    created_at: nowIso(),
  };
  await db().collection(COLLECTIONS.shortlistItems).doc(id).set(item);

  revalidatePath("/browse");
  revalidatePath(`/browse/${listingId}`);
  revalidatePath("/shortlist");
  revalidatePath("/parent");
  return { ok: true };
}

export async function removeFromShortlist(listingId: string): Promise<{
  ok: boolean;
  error?: string;
  needsAuth?: boolean;
}> {
  const ctx = await requireParentLike();
  if (!ctx.ok) {
    return {
      ok: false,
      error: ctx.error,
      needsAuth: "needsAuth" in ctx ? ctx.needsAuth : false,
    };
  }

  const id = shortlistDocId(ctx.profile.id, listingId);
  await db().collection(COLLECTIONS.shortlistItems).doc(id).delete();

  revalidatePath("/browse");
  revalidatePath(`/browse/${listingId}`);
  revalidatePath("/shortlist");
  revalidatePath("/parent");
  return { ok: true };
}

export async function toggleShortlistAction(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "").trim();
  const intent = String(formData.get("intent") ?? "add");
  const returnTo = String(formData.get("returnTo") ?? "/shortlist").trim() ||
    "/shortlist";

  if (!listingId) {
    redirect(returnTo);
  }

  if (intent === "remove") {
    const result = await removeFromShortlist(listingId);
    if (result.needsAuth) {
      redirect(
        `/sign-in?next=${encodeURIComponent(`/shortlist?add=${listingId}`)}`,
      );
    }
    redirect(returnTo);
  }

  const result = await addToShortlist(listingId);
  if (result.needsAuth) {
    redirect(
      `/sign-in?next=${encodeURIComponent(`/shortlist?add=${listingId}`)}`,
    );
  }
  if (!result.ok && result.error) {
    redirect(
      `${returnTo}${returnTo.includes("?") ? "&" : "?"}shortlistError=${encodeURIComponent(result.error)}`,
    );
  }
  redirect(returnTo);
}
