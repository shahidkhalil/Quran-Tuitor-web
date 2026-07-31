/** Marketing SEO guides — static articles that deep-link to Browse / Courses. */

export type GuideSection = {
  heading: string;
  body: string;
};

export type GuideArticle = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  readMinutes: number;
  ctaHref: string;
  ctaLabel: string;
  sections: GuideSection[];
};

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: "how-to-choose-a-tajweed-tutor",
    title: "How to choose a Tajweed tutor online",
    eyebrow: "Guide",
    description:
      "What to look for in a verified Tajweed teacher — language, gender preference, trial fit, and platform payments.",
    readMinutes: 4,
    ctaHref: "/browse?subject=tajweed&sort=rating",
    ctaLabel: "Browse Tajweed tutors",
    sections: [
      {
        heading: "Start with verified listings",
        body: "On a managed marketplace, tutors are vetted before they publish. Look for a clear photo, subjects that include Tajweed, languages you speak at home, and a rate you can sustain weekly.",
      },
      {
        heading: "Match language and gender preferences",
        body: "Many families filter for female or male tutors, especially for daughters. Use Browse filters, then shortlist two or three teachers to compare side by side.",
      },
      {
        heading: "Book a free trial first",
        body: "A free trial lets you hear pronunciation teaching style before you pay. Join on the secure meeting link after the tutor accepts — no card is required for the trial.",
      },
      {
        heading: "Pay only on the platform",
        body: "If the trial goes well, continue with a lesson package through platform checkout. Never send money directly to a tutor — receipts, rematch, and support stay with the marketplace.",
      },
      {
        heading: "Watch progress after paid lessons",
        body: "After completed paid sessions, tutors submit Covered / Improve / Homework notes. Parental Watch and Revision keep practice visible between classes.",
      },
    ],
  },
  {
    slug: "free-trial-checklist-for-parents",
    title: "Free trial checklist for parents",
    eyebrow: "Guide",
    description:
      "Prepare learners, devices, and questions so your first free Quran tutoring trial runs smoothly.",
    readMinutes: 3,
    ctaHref: "/browse",
    ctaLabel: "Find a tutor",
    sections: [
      {
        heading: "Add a learner profile",
        body: "Create a child or adult learner before booking. Trials attach to that profile so progress and messages stay organised.",
      },
      {
        heading: "Run a system check",
        body: "Before join time, use the pre-lesson system check for camera and microphone. Headphones reduce echo; Chrome or Edge work best.",
      },
      {
        heading: "Agree what “good” looks like",
        body: "Decide whether you care most about Tajweed rules, fluent reading, Hifz, or kids’ comfort. Share that briefly in messages after booking.",
      },
      {
        heading: "After the trial",
        body: "If it fits, continue to a paid package on-platform. If not, browse again or open support for rematch options on paid packages later.",
      },
    ],
  },
  {
    slug: "online-hifz-with-accountability",
    title: "Online Hifz with family accountability",
    eyebrow: "Guide",
    description:
      "How families keep memorisation steady with weekly lessons, homework checklists, and a simple Hifz tracker.",
    readMinutes: 4,
    ctaHref: "/courses/hifz",
    ctaLabel: "Explore Hifz tutors",
    sections: [
      {
        heading: "Pick a Hifz-focused tutor",
        body: "Filter Browse for Hifz / memorisation. Use a free trial to test pace, muraja’ah style, and how the tutor works with your learner’s age.",
      },
      {
        heading: "Keep a light tracker",
        body: "Use the Hifz tracker to log surah status and ayah reached. Share updates with a co-parent via Family sharing if you want view-only Watch access.",
      },
      {
        heading: "Practice between lessons",
        body: "Homework from progress notes appears on Revision as a checklist. Tick items as the learner practices so the next class starts ready.",
      },
      {
        heading: "Renew packages on time",
        body: "When scheduled lessons run low, renew through platform checkout so the weekly rhythm does not break.",
      },
    ],
  },
  {
    slug: "quran-classes-for-kids-at-home",
    title: "Quran classes for kids at home",
    eyebrow: "Guide",
    description:
      "Tips for calm online classes — child-friendly tutors, short sessions, and parental oversight without hovering on every call.",
    readMinutes: 3,
    ctaHref: "/courses/kids",
    ctaLabel: "Browse tutors for kids",
    sections: [
      {
        heading: "Filter for child experience",
        body: "Use the kids course page or Browse children filter. Read how tutors describe experience with younger learners before you book a trial.",
      },
      {
        heading: "Keep sessions predictable",
        body: "Same weekday and time help habits form. After payment, set a weekly schedule so join links appear on the calendar.",
      },
      {
        heading: "Stay nearby for early lessons",
        body: "Sit close for the first few classes to help with devices, then step back as confidence grows. Parental Watch summarises attendance and notes afterward.",
      },
      {
        heading: "Trust the platform ops",
        body: "Messaging stays parent-visible. Payments stay on-platform. If something goes wrong, open a support case instead of paying the tutor directly.",
      },
    ],
  },
];

export function getGuideArticle(slug: string): GuideArticle | null {
  return GUIDE_ARTICLES.find((g) => g.slug === slug) ?? null;
}

export function guideArticleSlugs(): string[] {
  return GUIDE_ARTICLES.map((g) => g.slug);
}
