import Link from "next/link";
import { SupportCaseForm } from "@/components/support/support-case-form";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  isSupportBookingKind,
  isSupportCategory,
  type SupportBookingKind,
  type SupportCategory,
} from "@/domain/support-cases";
import { listMySupportBookingOptions } from "@/server/actions/support-cases";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Open support case" };

type Props = {
  searchParams: Promise<{
    help?: string;
    category?: string;
    bookingKind?: string;
    bookingId?: string;
  }>;
};

function defaultsFromParams(params: {
  help?: string;
  category?: string;
  bookingKind?: string;
  bookingId?: string;
}): {
  category: SupportCategory | null;
  bookingValue: string | null;
} {
  if (params.help === "payout-failed") {
    return { category: "payment", bookingValue: null };
  }
  if (params.help === "tutor-no-show") {
    return { category: "no_show", bookingValue: null };
  }

  let category: SupportCategory | null = null;
  if (params.category && isSupportCategory(params.category)) {
    category = params.category;
  }

  let bookingValue: string | null = null;
  if (
    params.bookingKind &&
    isSupportBookingKind(params.bookingKind) &&
    params.bookingId?.trim()
  ) {
    bookingValue = `${params.bookingKind as SupportBookingKind}:${params.bookingId.trim()}`;
  }

  return { category, bookingValue };
}

export default async function TutorSupportNewPage({ searchParams }: Props) {
  const params = await searchParams;
  const { options, error } = await listMySupportBookingOptions();
  const defaults = defaultsFromParams(params);

  return (
    <div>
      <PanelPageHeader
        eyebrow="Help"
        title="Open a support case"
        description="Select the related booking and describe the issue. Stay here for SLA updates."
        actions={
          <Link href="/tutor/support" className="btn-panel btn-panel-secondary">
            Back to Support
          </Link>
        }
      />

      {error ? (
        <p role="alert" className="mb-6 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}

      <SupportCaseForm
        options={options}
        defaultCategory={defaults.category}
        defaultBookingValue={defaults.bookingValue}
        cancelHref="/tutor/support"
      />
    </div>
  );
}
