export const ENFORCEMENT_ACTIONS = [
  "warn",
  "suspend",
  "unlist",
  "clear",
] as const;

export type EnforcementAction = (typeof ENFORCEMENT_ACTIONS)[number];

export const ENFORCEMENT_STATUSES = [
  "clear",
  "warned",
  "suspended",
  "unlisted",
] as const;

export type EnforcementStatus = (typeof ENFORCEMENT_STATUSES)[number];

/** Stored on profiles for tutors. */
export type TutorEnforcementState = {
  enforcement_status: EnforcementStatus;
  /** Shown to parents / on booking errors — never expose internal notes. */
  enforcement_public_message: string | null;
  /** Admin-only reason. */
  enforcement_internal_reason: string | null;
  enforcement_updated_at: string | null;
  enforcement_updated_by: string | null;
};

export type TutorEnforcementEvent = {
  id: string;
  tutor_id: string;
  action: EnforcementAction;
  status_after: EnforcementStatus;
  internal_reason: string;
  public_message: string | null;
  actor_id: string;
  created_at: string;
};

export function isEnforcementAction(value: string): value is EnforcementAction {
  return (ENFORCEMENT_ACTIONS as readonly string[]).includes(value);
}

export function enforcementStatusLabel(status: EnforcementStatus): string {
  switch (status) {
    case "clear":
      return "Clear";
    case "warned":
      return "Warned";
    case "suspended":
      return "Suspended";
    case "unlisted":
      return "Unlisted";
  }
}

export function enforcementActionLabel(action: EnforcementAction): string {
  switch (action) {
    case "warn":
      return "Warn";
    case "suspend":
      return "Suspend";
    case "unlist":
      return "Unlist";
    case "clear":
      return "Clear / reinstate";
  }
}

/** Suspended and unlisted tutors cannot take new trials/paid bookings. */
export function canTutorAcceptNewBookings(status: EnforcementStatus): boolean {
  return status === "clear" || status === "warned";
}

export function statusAfterAction(action: EnforcementAction): EnforcementStatus {
  switch (action) {
    case "warn":
      return "warned";
    case "suspend":
      return "suspended";
    case "unlist":
      return "unlisted";
    case "clear":
      return "clear";
  }
}

export function defaultPublicMessage(action: EnforcementAction): string | null {
  switch (action) {
    case "warn":
      return null;
    case "suspend":
      return "This tutor is temporarily unavailable for new bookings.";
    case "unlist":
      return "This tutor is not available for new bookings right now.";
    case "clear":
      return null;
  }
}

export function readEnforcement(
  data: Partial<TutorEnforcementState> | undefined | null,
): TutorEnforcementState {
  const status = data?.enforcement_status;
  return {
    enforcement_status:
      status && (ENFORCEMENT_STATUSES as readonly string[]).includes(status)
        ? status
        : "clear",
    enforcement_public_message: data?.enforcement_public_message ?? null,
    enforcement_internal_reason: data?.enforcement_internal_reason ?? null,
    enforcement_updated_at: data?.enforcement_updated_at ?? null,
    enforcement_updated_by: data?.enforcement_updated_by ?? null,
  };
}
