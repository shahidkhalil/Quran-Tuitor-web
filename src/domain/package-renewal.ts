/** Package renewal prompts when remaining scheduled lessons run low. */

export const PACKAGE_RENEWAL_THRESHOLD = 1;

export type PackageLessonRef = {
  recurring_booking_id: string;
  status: string;
};

export type PackageBalanceInput = {
  paymentId: string;
  recurringBookingId: string;
  listingId: string;
  learnerId: string;
  tutorId: string;
  lessonCount: number;
  status: "active" | "cancelled" | string;
};

export type PackageRenewalPrompt = {
  paymentId: string;
  recurringBookingId: string;
  listingId: string;
  learnerId: string;
  tutorId: string;
  lessonCount: number;
  remainingScheduled: number;
};

export function countRemainingScheduled(
  lessons: PackageLessonRef[],
  recurringBookingId: string,
): number {
  return lessons.filter(
    (l) =>
      l.recurring_booking_id === recurringBookingId &&
      l.status === "scheduled",
  ).length;
}

/** Active packages with remaining scheduled lessons at or below threshold. */
export function packagesNeedingRenewal(
  packages: PackageBalanceInput[],
  lessons: PackageLessonRef[],
  threshold: number = PACKAGE_RENEWAL_THRESHOLD,
): PackageRenewalPrompt[] {
  const out: PackageRenewalPrompt[] = [];
  for (const pkg of packages) {
    if (pkg.status !== "active") continue;
    if (!pkg.recurringBookingId) continue;
    const remainingScheduled = countRemainingScheduled(
      lessons,
      pkg.recurringBookingId,
    );
    if (remainingScheduled > threshold) continue;
    out.push({
      paymentId: pkg.paymentId,
      recurringBookingId: pkg.recurringBookingId,
      listingId: pkg.listingId,
      learnerId: pkg.learnerId,
      tutorId: pkg.tutorId,
      lessonCount: pkg.lessonCount,
      remainingScheduled,
    });
  }
  return out.sort((a, b) => a.remainingScheduled - b.remainingScheduled);
}

export function renewalPromptCopy(prompt: PackageRenewalPrompt): {
  title: string;
  body: string;
} {
  if (prompt.remainingScheduled <= 0) {
    return {
      title: "Package finished — renew lessons",
      body: `Your ${prompt.lessonCount}-lesson package has no sessions left. Buy another package on the platform to keep learning.`,
    };
  }
  return {
    title: `Only ${prompt.remainingScheduled} lesson${prompt.remainingScheduled === 1 ? "" : "s"} left`,
    body: `Your package is almost finished. Renew with a new ${prompt.lessonCount}-lesson package before the last session.`,
  };
}
