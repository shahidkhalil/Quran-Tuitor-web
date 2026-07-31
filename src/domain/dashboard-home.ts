/** Pure helpers for parent/tutor home guidance (no side effects). */

export type ParentNextStep = {
  title: string;
  body: string;
  href: string;
  cta: string;
};

export function parentNextStep(input: {
  learnerCount: number;
  openTrialCount: number;
  upcomingLessonCount: number;
  shortlistCount: number;
  hasActiveTutor: boolean;
}): ParentNextStep {
  if (input.learnerCount === 0) {
    return {
      title: "Add a learner",
      body: "Create a child or adult learner profile before booking a free trial.",
      href: "/parent/learners",
      cta: "Add learner",
    };
  }
  if (input.upcomingLessonCount > 0) {
    return {
      title: "Join your next lesson",
      body: `You have ${input.upcomingLessonCount} paid lesson${input.upcomingLessonCount === 1 ? "" : "s"} on the schedule.`,
      href: "/parent/schedule",
      cta: "Open schedule",
    };
  }
  if (input.openTrialCount > 0) {
    return {
      title: "Continue your free trial",
      body: "Check join links, summaries, and convert to a paid package when ready.",
      href: "/parent/bookings",
      cta: "View bookings",
    };
  }
  if (input.hasActiveTutor) {
    return {
      title: "Book a paid package",
      body: "Continue with platform checkout after a successful trial.",
      href: "/parent/bookings",
      cta: "Continue to paid",
    };
  }
  if (input.shortlistCount > 0) {
    return {
      title: "Book a free trial",
      body: "You saved tutors — open shortlist or browse to book a $0 trial.",
      href: "/shortlist",
      cta: "Open shortlist",
    };
  }
  return {
    title: "Find a verified tutor",
    body: "Browse the marketplace and book a free trial — $0, no card required.",
    href: "/browse",
    cta: "Find tutors",
  };
}

export type TutorCompleteness = {
  percent: number;
  missingLabels: string[];
  published: boolean;
  hasPhoto: boolean;
  hasIntroVideo: boolean;
  hasIntroAudio: boolean;
  payoutsReady: boolean;
};

export function tutorProfileCompleteness(input: {
  missingFieldLabels: string[];
  published: boolean;
  hasPhoto: boolean;
  hasIntroVideo: boolean;
  hasIntroAudio: boolean;
  payoutsEnabled: boolean;
  hasConnectAccount: boolean;
}): TutorCompleteness {
  const steps = [
    input.missingFieldLabels.length === 0,
    input.hasPhoto,
    input.published,
    input.hasConnectAccount,
    input.payoutsEnabled,
    ...(input.published
      ? [input.hasIntroVideo, input.hasIntroAudio]
      : []),
  ];
  const done = steps.filter(Boolean).length;
  const percent = Math.round((done / steps.length) * 100);
  const missingLabels = [...input.missingFieldLabels];
  if (!input.hasPhoto) missingLabels.push("Profile photo");
  if (!input.published) missingLabels.push("Publish listing");
  if (input.published && !input.hasIntroVideo) {
    missingLabels.push("Intro video");
  }
  if (input.published && !input.hasIntroAudio) {
    missingLabels.push("Intro voice");
  }
  if (!input.hasConnectAccount) missingLabels.push("Connect payouts");
  else if (!input.payoutsEnabled) missingLabels.push("Finish payout setup");
  return {
    percent,
    missingLabels: missingLabels.slice(0, 5),
    published: input.published,
    hasPhoto: input.hasPhoto,
    hasIntroVideo: input.hasIntroVideo,
    hasIntroAudio: input.hasIntroAudio,
    payoutsReady: input.payoutsEnabled,
  };
}

export const PARENT_HELP_FAQS = [
  {
    q: "How do I book a free trial?",
    a: "Add a learner, open Browse, pick a tutor, and book a free trial — $0, no card.",
    href: "/browse",
  },
  {
    q: "How do I join a class?",
    a: "Open Bookings or Schedule, tap Join lesson — you’ll get a quick camera/mic check first.",
    href: "/parent/system-check",
  },
  {
    q: "Mic or camera not working?",
    a: "Use the classroom troubleshooting checklist: browser, permissions, headphones, then support if needed.",
    href: "/parent/help",
  },
  {
    q: "Where do I see progress?",
    a: "Parental Watch and each learner’s Progress page show notes and homework after lessons.",
    href: "/parent/watch",
  },
  {
    q: "Will I get lesson reminders?",
    a: "Yes — in-app (and email if Resend is configured) about 24 hours and 15 minutes before paid lessons and accepted trials.",
    href: "/parent/schedule",
  },
  {
    q: "How does rematch work?",
    a: "Open Support from a booking if something goes wrong. Admins can rematch unused lessons.",
    href: "/parent/support",
  },
  {
    q: "How do platform payments work?",
    a: "After a trial, pay packages through the platform — never send money to tutors directly.",
    href: "/parent/bookings",
  },
] as const;

export const TUTOR_HELP_FAQS = [
  {
    q: "How do I get more trials?",
    a: "Publish a complete listing with photo, subjects, languages, timezone, and rate.",
    href: "/tutor/listing",
  },
  {
    q: "How do I join a lesson?",
    a: "Open Calendar or Trial requests and use Join — a device check runs before the meeting link.",
    href: "/tutor/system-check",
  },
  {
    q: "Mic or camera not working?",
    a: "Follow the classroom troubleshooting checklist, then open a support case if you’re still blocked.",
    href: "/tutor/help",
  },
  {
    q: "When do I get paid?",
    a: "Connect Stripe on Earnings, then request a payout when your balance clears the minimum.",
    href: "/tutor/earnings",
  },
] as const;
