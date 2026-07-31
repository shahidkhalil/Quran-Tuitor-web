/** Marketing blog — dated posts that deep-link to Browse / Guides / Teach. */

export type BlogSection = {
  heading: string;
  body: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  publishedAt: string;
  readMinutes: number;
  ctaHref: string;
  ctaLabel: string;
  sections: BlogSection[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-platform-payments-matter",
    title: "Why platform payments matter for online Quran classes",
    eyebrow: "Trust",
    description:
      "Receipts, rematch, and support only work when families pay on-platform — never send money directly to a tutor.",
    publishedAt: "2026-07-20",
    readMinutes: 4,
    ctaHref: "/browse",
    ctaLabel: "Browse verified tutors",
    sections: [
      {
        heading: "What “managed marketplace” really means",
        body: "Quran Tutor verifies teachers before they publish, then keeps messaging parent-visible and money inside the product. That is different from open marketplaces where parents negotiate and pay tutors privately.",
      },
      {
        heading: "Receipts and unused lessons",
        body: "Packages bought on-platform leave a clear trail: how many lessons remain, when they renew, and what support can rematch if a fit breaks down. Off-platform transfers leave families without that safety net.",
      },
      {
        heading: "Free trial first, pay later",
        body: "Start with a free trial — no card. If the teaching style fits, continue with a paid package through checkout. You should never be asked to send cash, bank transfer, or wallet payments to a tutor.",
      },
      {
        heading: "If someone asks you to pay elsewhere",
        body: "Decline and open Support from your bookings. Tutors who push off-platform payments risk enforcement. Families who stay on-platform keep rematch and dispute options.",
      },
    ],
  },
  {
    slug: "after-your-first-free-trial",
    title: "What to notice after your first free Quran trial",
    eyebrow: "Parents",
    description:
      "A simple debrief for families: pronunciation teaching, learner comfort, device setup, and whether to book a package.",
    publishedAt: "2026-07-22",
    readMinutes: 3,
    ctaHref: "/guides/free-trial-checklist-for-parents",
    ctaLabel: "Free trial checklist",
    sections: [
      {
        heading: "Did the learner feel safe?",
        body: "Comfort matters as much as content. Note whether the tutor greeted warmly, paced for the child’s age, and left space for questions — especially for first-time online learners.",
      },
      {
        heading: "How was Tajweed or reading taught?",
        body: "Listen for clear correction without harshness. Ask yourself whether the tutor explained why a sound changed, not only that it was wrong.",
      },
      {
        heading: "Tech and routine",
        body: "If camera, mic, or headphones caused friction, run the pre-lesson system check before the next session. A calm device setup makes the second lesson feel easier.",
      },
      {
        heading: "Decide with a shortlist",
        body: "If you are unsure, trial a second tutor from Browse and compare on Shortlist. When one feels right, continue with a platform package — not a private payment.",
      },
    ],
  },
  {
    slug: "weekly-quran-habit-at-home",
    title: "Building a weekly Quran habit with online lessons",
    eyebrow: "Habits",
    description:
      "How families keep momentum between classes with a fixed slot, homework checklists, and light progress tracking.",
    publishedAt: "2026-07-25",
    readMinutes: 4,
    ctaHref: "/courses/kids",
    ctaLabel: "Find tutors for kids",
    sections: [
      {
        heading: "Anchor one weekly slot",
        body: "Same weekday and time reduce negotiation at home. After you buy a package, set the recurring schedule so join links appear on Schedule without last-minute scrambling.",
      },
      {
        heading: "Practice in small bites",
        body: "Homework from progress notes lands on Revision as a checklist. Five to ten focused minutes on weekdays often beats one long weekend catch-up.",
      },
      {
        heading: "Make progress visible",
        body: "Parental Watch and the Hifz tracker (when memorising) help co-parents see what was covered without joining every call. Share view-only Watch access if another adult helps at home.",
      },
      {
        heading: "Renew before the gap",
        body: "When remaining lessons run low, renew on-platform so the weekly rhythm does not break. Consistency beats intensity for children building Tajweed and Hifz habits.",
      },
    ],
  },
  {
    slug: "intro-video-and-voice-samples",
    title: "How intro video and voice samples help you choose a tutor",
    eyebrow: "Browse",
    description:
      "Why listings with a short clip or recitation sample build trust before you book a free trial.",
    publishedAt: "2026-07-28",
    readMinutes: 3,
    ctaHref: "/browse",
    ctaLabel: "Browse tutors",
    sections: [
      {
        heading: "See teaching presence early",
        body: "An intro video shows tone, pacing, and how a tutor speaks to camera. On Browse, look for the Intro video badge, then watch on the profile before you request a trial.",
      },
      {
        heading: "Hear pronunciation style",
        body: "A voice sample lets you hear recitation or a short greeting. That helps families who care deeply about Tajweed quality before committing calendar time.",
      },
      {
        heading: "Still book a free trial",
        body: "Media is a filter, not a substitute for a live lesson. Use clips to shortlist, then confirm fit with a free trial on the secure meeting link.",
      },
      {
        heading: "Tutors: keep media up to date",
        body: "Verified teachers can add a YouTube intro URL and upload a short voice sample from the listing editor. Listings with both tend to feel more complete to parents.",
      },
    ],
  },
  {
    slug: "teach-quran-online-verified",
    title: "Teaching Quran online as a verified marketplace tutor",
    eyebrow: "Tutors",
    description:
      "What applying, publishing a listing, and running trials looks like when payouts and messaging stay on-platform.",
    publishedAt: "2026-07-30",
    readMinutes: 4,
    ctaHref: "/teach",
    ctaLabel: "Teach with us",
    sections: [
      {
        heading: "Apply with credentials and intro media",
        body: "Submit your application with teaching experience and an intro video when you can. The team reviews before you become a verified tutor who can publish.",
      },
      {
        heading: "Publish a complete listing",
        body: "Headline, bio, subjects, rate in USD, photo, and optional intro video or voice sample help parents discover you. Only published listings appear on Browse.",
      },
      {
        heading: "Accept trials, then packages",
        body: "Respond to free-trial requests promptly. After a good fit, families buy packages on-platform — you never collect payment yourself.",
      },
      {
        heading: "Connect payouts and stay clear",
        body: "Finish Stripe Connect so earnings can withdraw. Keep chat professional and parent-visible. Never ask families to pay you directly.",
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | null {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}

export function blogPostSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}

export function formatBlogDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
