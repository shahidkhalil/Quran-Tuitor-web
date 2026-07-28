export const APPLICATION_STATUSES = [
  "pending",
  "needs_info",
  "approved",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Ordered steps for the visual timeline (rejected is a terminal branch). */
export const TIMELINE_STEPS: ApplicationStatus[] = [
  "pending",
  "needs_info",
  "approved",
];

export const PAYOUT_METHODS = [
  { value: "wise", label: "Wise" },
  { value: "paypal", label: "PayPal" },
  { value: "bank", label: "Bank transfer" },
  { value: "other", label: "Other" },
] as const;

export type PayoutMethod = (typeof PAYOUT_METHODS)[number]["value"];

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_say", label: "Prefer not to say" },
] as const;

export type TutorApplication = {
  id: string;
  applicant_id: string;
  status: ApplicationStatus;
  full_name: string;
  country: string;
  phone: string | null;
  gender: string | null;
  languages: string;
  credentials_summary: string;
  credential_paths: string[];
  child_experience: string;
  years_teaching: number | null;
  intro_video_url: string | null;
  intro_video_path: string | null;
  payout_method: PayoutMethod;
  payout_notes: string | null;
  status_reason: string | null;
  applicant_response: string | null;
  applicant_response_at: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

export type ApplicationEvent = {
  id: string;
  application_id: string;
  status: ApplicationStatus;
  note: string | null;
  actor_id: string | null;
  actor_role: "system" | "applicant" | "admin";
  created_at: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function statusLabel(status: ApplicationStatus): string {
  switch (status) {
    case "pending":
      return "Pending review";
    case "needs_info":
      return "Needs more info";
    case "approved":
      return "Approved";
    case "rejected":
      return "Not approved";
  }
}

export function statusDescription(status: ApplicationStatus): string {
  switch (status) {
    case "pending":
      return "Our team is reviewing your credentials and intro.";
    case "needs_info":
      return "Please respond to the request below so we can continue.";
    case "approved":
      return "You’re verified. Next you’ll complete your public listing.";
    case "rejected":
      return "We’re not able to approve this application at this time.";
  }
}
