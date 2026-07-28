---
title: EXPERIENCE — Quran Tutor Marketplace
status: final
created: 2026-07-19
updated: 2026-07-19
sources:
  - _bmad-output/planning-artifacts/prds/prd-Quran-Tuitor-web-2026-07-19/prd.md
  - _bmad-output/planning-artifacts/briefs/brief-Quran-Tuitor-web-2026-07-19/brief.md
  - _bmad-output/planning-artifacts/research/market-managed-online-quran-tutoring-marketplace-research-2026-07-19.md
---

# Quran Tutor Marketplace — Experience Spine

Visual tokens: `DESIGN.md`. Behavior owns this file. Spines win on conflict with any mock.

## Foundation

- **Form-factor:** Responsive web (mobile + desktop browsers). No native apps in MVP. `[ASSUMPTION from PRD]`
- **UI system:** shadcn/ui + Tailwind on Next.js. `[ASSUMPTION from PRD addendum]` Brand deltas only in `DESIGN.md`.
- **Locales:** English UI, USD, timezone-aware availability (global).
- **Roles:** Parent Account, adult learner, applicant tutor, Verified Tutor, Admin.

## Information Architecture

### Public / marketing

| Surface | Purpose |
|---|---|
| Landing | Brand + promise (choice + managed trust) + CTAs: Browse tutors / Teach with us |
| Browse / Search | Filterable Verified Tutor results |
| Listing detail | Full profile, book trial CTA |
| Shortlist | Compare saved tutors |
| Teach with us | Tutor value prop → start application |
| Auth | Register / sign-in / email verify |

### Parent app shell

| Surface | Purpose |
|---|---|
| Home / Dashboard | Upcoming lessons, continue shortlist, open cases |
| Learners | Learner Profile list/create/edit |
| Messages | Parent-Visible Threads |
| Bookings / Calendar | Upcoming + past; join link; attendance |
| Progress | Progress Note history per learner |
| Payments | Invoices, payment methods |
| Support | Cases list + open case |
| Account | Profile, password, notifications |

### Tutor shell

| Surface | Purpose |
|---|---|
| Application status | pending / needs_info / approved / rejected |
| Listing editor | Rates, availability, subjects, media |
| Requests | Trial / booking accept-decline |
| Calendar | Upcoming sessions + join |
| Students | Active relationships |
| Earnings | Ledger + payouts |
| Support | Cases |

### Admin shell

| Surface | Purpose |
|---|---|
| Vetting queue | Applications |
| Tutors | Listings, suspend/unlist |
| Bookings | Overview |
| Cases | Support workspace |
| Settings | Commission, policy flags |

**Nav rules:** Role-based shells; never show Admin in parent nav. Mobile: bottom nav for parent (Home, Browse, Bookings, Messages, More); tutor similar with Earnings instead of Browse.

## Voice and Tone

Microcopy. Brand aesthetic in `DESIGN.md`.

| Do | Don't |
|---|---|
| “Pay on the platform — never send money to a tutor.” | “Complete payment with your teacher on WhatsApp.” |
| “Verified tutor” | “Highly qualified!!!” |
| “Adam’s trial is booked for Thursday 5:00pm.” | “Your amazing learning journey starts now 🚀” |
| “We’ll rematch you at no extra cost.” | “Sorry for the inconvenience you may have faced.” (corporate fog) |
| Calm, specific, respectful of Quran context | Guilt, fear-mongering, or salesy countdown timers on trial |

## Component Patterns (behavioral)

| Pattern | Rules |
|---|---|
| Listing card | Entire card opens detail; primary CTA on detail is Book free trial |
| Filter bar | Desktop: sticky sidebar or top bar; mobile: Filter sheet; show active filter count |
| Trust strip | Visible on Listing + checkout: platform payments, parent-visible chat, free rematch |
| Trial book | Slot picker; **no card fields**; confirm → success with “What to expect” |
| Progress Note | Structured fields: covered / improve / homework — not freeform wall only |
| Support Case | Category + booking picker + description; confirm SLA expectation copy |
| Status timeline | Tutor application: always show current step + last update time |

## State Patterns

| State | Treatment |
|---|---|
| Browse empty filters | “No tutors match. Clear filters or widen timezone.” + clear CTA |
| Trial pending tutor accept | Parent sees “Waiting for tutor confirmation” + timeout note (24h) |
| Tutor declined trial | Soft fail + “Pick another from shortlist” |
| Checkout success | Receipt + next lesson on calendar + messages entry point |
| Tutor no-show | Banner on booking: “Report / reschedule” → Support Case |
| Rematch offered | Clear accept flow; preserve package credits messaging |
| Application rejected | Reason + whether reapply allowed |
| Payout failed | Status + open Support Case |
| Loading | Skeletons matching listing/calendar layout |
| Error | Inline + retry; never blank page |

## Interaction Primitives

- Primary actions: one obvious per screen (Book trial, Pay & schedule, Submit note, Approve tutor).
- Destructive (suspend tutor, cancel package): confirm dialog.
- Messages: send on Enter (Shift+Enter newline) on desktop; send button on mobile.
- Join lesson: large Join button 15 min before → opens third-party video link.
- Keyboard: focus rings `{colors.focus-ring}`; skip-to-content on marketing and app shells.

## Accessibility Floor

- Aim **WCAG 2.1 AA** on parent browse → trial → pay → messages.
- Min touch target 44px for primary actions.
- Filters and status not color-only (icons/text).
- Arabic preview has `lang="ar" dir="rtl"` when shown.
- Motion: prefer reduced-motion; no auto-playing intro video with sound.

## Key Flows

### Flow A — UJ-1 Sarah books Adam’s tutor

1. Lands on Landing (Google/Facebook) → sees brand + trust promise → **Browse tutors**.
2. Filters: male, English+Urdu, children, Tajweed, price, timezone → opens Listing → shortlists.
3. **Book free trial** (no card) → observes trial with Adam → reads summary.
4. **Climax:** Converts to recurring → pays on platform → calendar shows next lesson.
5. Later: no-show → Support Case → rematch offered → stays.

### Flow B — UJ-2 Yusuf onboarding to first payout

1. Teach with us → application → status visible.
2. Approved → completes Listing → accepts trial → summary.
3. **Climax:** Paid lesson completed → earnings visible → weekly payout.

### Flow C — UJ-3 Amina ops

1. Vetting queue → approve Yusuf.
2. Case from Sarah no-show → thread + attendance → rematch/reschedule → optional warn tutor.
3. **Climax:** Case closed inside SLA.

## Inspiration & Anti-patterns

**Borrow patterns from:** Calm marketplace browse (clear filters, rich profiles); fintech-like payment clarity; support case timelines.

**Avoid:** Assign-only academy wizards that hide tutor choice; WhatsApp-looking chat that implies off-platform pay; recording-first surveillance UI; cluttered SEO landing with fake scarcity.

## Responsive & Platform

- Breakpoints: mobile &lt;768, tablet 768–1024, desktop &gt;1024.
- Listing gallery: stack on mobile; two-column on desktop (media | details).
- Admin: desktop-optimized; usable tablet; warn on very small screens for vetting docs.

## Open UX Assumptions

- Bottom nav IA for parent/tutor on mobile.
- Shortlist persists per Parent Account.
- Adult learners use same browse/book shell without Learners custody UI.
- Video is external link, not embedded custom classroom in MVP.

## Finalize notes

- Reviewer Gate: **skipped** at stakeholder request to finalize.
- Key-screen mocks: **spine-only** for MVP handoff (Landing, Browse, Listing, Trial book, Parent calendar, Tutor earnings, Admin vetting). Build from IA tables unless visuals requested later.
- Open assumptions retained for architecture (shadcn/Next.js, bottom nav, adult learner shell parity).
- Finalized: 2026-07-19
