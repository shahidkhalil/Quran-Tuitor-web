import { getAdminDb } from "@/lib/firebase/admin";

export const COLLECTIONS = {
  profiles: "profiles",
  learnerProfiles: "learner_profiles",
  tutorApplications: "tutor_applications",
  tutorApplicationEvents: "tutor_application_events",
  tutorListings: "tutor_listings",
  shortlistItems: "shortlist_items",
  trialBookings: "trial_bookings",
  ledgerEntries: "ledger_entries",
  payments: "payments",
  providerEvents: "provider_events",
  recurringBookings: "recurring_bookings",
  scheduledLessons: "scheduled_lessons",
  attendanceRecords: "attendance_records",
  lessonReviews: "lesson_reviews",
  payoutRequests: "payout_requests",
  messageThreads: "message_threads",
  progressNotes: "progress_notes",
  hifzTrackers: "hifz_trackers",
  familyShares: "family_shares",
  notifications: "notifications",
  supportCases: "support_cases",
  rematches: "rematches",
  tutorEnforcementEvents: "tutor_enforcement_events",
  platformConfig: "platform_config",
  auditLog: "audit_log",
} as const;

export function db() {
  return getAdminDb();
}

export function nowIso() {
  return new Date().toISOString();
}

export function docId() {
  return db().collection("_ids").doc().id;
}
