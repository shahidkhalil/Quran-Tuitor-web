export const SUPPORT_CATEGORIES = [
  "no_show",
  "quality",
  "payment",
  "other",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const SUPPORT_BOOKING_KINDS = ["trial", "lesson"] as const;

export type SupportBookingKind = (typeof SUPPORT_BOOKING_KINDS)[number];

/** Story 7.1 opens as `open`; Story 7.2 expands workflow statuses. */
export const SUPPORT_CASE_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export type SupportCaseStatus = (typeof SUPPORT_CASE_STATUSES)[number];

export type SupportReporterRole = "parent" | "adult" | "tutor";

export type SupportCase = {
  id: string;
  reporter_id: string;
  reporter_role: SupportReporterRole;
  category: SupportCategory;
  booking_kind: SupportBookingKind;
  booking_id: string;
  parent_id: string;
  tutor_id: string;
  learner_id: string;
  listing_id: string;
  description: string;
  status: SupportCaseStatus;
  /** Admin-only notes (never shown to reporter). */
  admin_internal_notes: string | null;
  /** Visible outcome update for the reporter. */
  outcome_note: string | null;
  /** Story 7.3 free rematch */
  rematch_id: string | null;
  rematch_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  last_updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export const SUPPORT_DESCRIPTION_MIN = 20;
export const SUPPORT_DESCRIPTION_MAX = 2000;

export const SUPPORT_SLA_COPY =
  "We aim to respond within 4 business hours and resolve within 5 business days. Stay in this Support thread — you never need to chase anyone off-platform.";

export function isSupportCategory(value: string): value is SupportCategory {
  return (SUPPORT_CATEGORIES as readonly string[]).includes(value);
}

export function isSupportBookingKind(value: string): value is SupportBookingKind {
  return (SUPPORT_BOOKING_KINDS as readonly string[]).includes(value);
}

export function isSupportCaseStatus(value: string): value is SupportCaseStatus {
  return (SUPPORT_CASE_STATUSES as readonly string[]).includes(value);
}

export function supportCategoryLabel(category: SupportCategory): string {
  switch (category) {
    case "no_show":
      return "No-show / missed lesson";
    case "quality":
      return "Lesson quality / fit";
    case "payment":
      return "Payment or payout";
    case "other":
      return "Other";
  }
}

export function supportCaseStatusLabel(status: SupportCaseStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In progress";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
  }
}

export function supportBookingKindLabel(kind: SupportBookingKind): string {
  return kind === "trial" ? "Free trial" : "Paid lesson";
}

export type SupportBookingOption = {
  value: string; // `${kind}:${id}`
  kind: SupportBookingKind;
  bookingId: string;
  label: string;
};
