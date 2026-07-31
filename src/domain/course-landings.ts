/** Marketing course landings → Browse deep links (additive SEO pages). */

export type CourseLanding = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  browseHref: string;
  browseLabel: string;
  highlights: string[];
  whoFor: string;
};

export const COURSE_LANDINGS: CourseLanding[] = [
  {
    slug: "tajweed",
    title: "Learn Tajweed online",
    eyebrow: "Tajweed",
    description:
      "Find verified tutors who teach correct pronunciation and rules of recitation. Book a free trial, then continue with platform payments.",
    browseHref: "/browse?subject=tajweed&sort=rating",
    browseLabel: "Browse Tajweed tutors",
    highlights: [
      "Filter by language, gender, and rate",
      "Free trial before you commit",
      "Parent-visible progress after paid lessons",
    ],
    whoFor: "Beginners through advanced students who want clear Tajweed foundations.",
  },
  {
    slug: "hifz",
    title: "Hifz & memorisation tutors",
    eyebrow: "Hifz",
    description:
      "Work one-on-one with tutors experienced in Qur’an memorisation. Structured trials and paid packages stay on-platform.",
    browseHref: "/browse?subject=hifz&sort=rating",
    browseLabel: "Browse Hifz tutors",
    highlights: [
      "Memorisation-focused listings",
      "Free trial to test teaching style",
      "Homework and progress notes for families",
    ],
    whoFor: "Students starting or continuing Hifz with accountable weekly lessons.",
  },
  {
    slug: "arabic",
    title: "Learn Arabic online",
    eyebrow: "Arabic",
    description:
      "Discover tutors who teach Arabic alongside Qur’anic studies. Compare rates, languages, and ratings before booking.",
    browseHref: "/browse?subject=arabic&sort=rating",
    browseLabel: "Browse Arabic tutors",
    highlights: [
      "Subject-filtered marketplace browse",
      "Secure join links for trials and packages",
      "Never pay a tutor off-platform",
    ],
    whoFor: "Kids and adults building Arabic reading and understanding.",
  },
  {
    slug: "quran-reading",
    title: "Qur’an reading for beginners",
    eyebrow: "Reading",
    description:
      "Start with Noorani-style reading and fluent recitation support from verified teachers.",
    browseHref: "/browse?subject=quran_reading&sort=rating",
    browseLabel: "Browse reading tutors",
    highlights: [
      "Beginner-friendly subject filter",
      "Shortlist and compare tutors",
      "Free rematch support if something goes wrong",
    ],
    whoFor: "New readers and families building daily reading habits.",
  },
  {
    slug: "kids",
    title: "Quran classes for kids",
    eyebrow: "For children",
    description:
      "Tutors with child teaching experience — browse listings that welcome younger learners, then book a free trial.",
    browseHref: "/browse?children=1&sort=rating",
    browseLabel: "Browse tutors for kids",
    highlights: [
      "Child-experience filter on Browse",
      "Parental Watch and progress notes",
      "Safe platform payments and messaging",
    ],
    whoFor: "Parents seeking calm, one-on-one online classes for children.",
  },
];

export function getCourseLanding(slug: string): CourseLanding | null {
  return COURSE_LANDINGS.find((c) => c.slug === slug) ?? null;
}

export function courseLandingSlugs(): string[] {
  return COURSE_LANDINGS.map((c) => c.slug);
}
