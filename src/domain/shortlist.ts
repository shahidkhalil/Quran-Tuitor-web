export type ShortlistItem = {
  id: string;
  parent_id: string;
  listing_id: string;
  created_at: string;
};

export function shortlistDocId(parentId: string, listingId: string): string {
  return `${parentId}_${listingId}`;
}

export const SHORTLIST_MAX = 12;
