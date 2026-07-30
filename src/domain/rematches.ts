/** Free rematch — transfer unused prepaid lessons to another verified tutor (Story 7.3). */

export type Rematch = {
  id: string;
  support_case_id: string;
  payment_id: string | null;
  recurring_booking_id_from: string | null;
  recurring_booking_id_to: string | null;
  parent_id: string;
  learner_id: string;
  from_tutor_id: string;
  from_listing_id: string;
  to_tutor_id: string;
  to_listing_id: string;
  /** Unused scheduled lessons moved (prepaid credits). */
  lessons_transferred: number;
  lesson_ids_cancelled: string[];
  /** Always 0 — free rematch invariant. */
  fee_cents: 0;
  executed_by: string;
  notes: string | null;
  created_at: string;
};

export const REMATCH_FEE_CENTS = 0 as const;
