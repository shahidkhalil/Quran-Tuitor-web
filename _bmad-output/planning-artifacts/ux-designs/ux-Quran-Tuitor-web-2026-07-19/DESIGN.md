---
name: Quran Tutor Marketplace
description: Visual identity for a global managed Quran tutor marketplace — calm trust, clear choice, no academy-brochure clichés.
status: final
created: 2026-07-19
updated: 2026-07-19
sources:
  - _bmad-output/planning-artifacts/prds/prd-Quran-Tuitor-web-2026-07-19/prd.md
  - _bmad-output/planning-artifacts/briefs/brief-Quran-Tuitor-web-2026-07-19/brief.md
  - _bmad-output/planning-artifacts/research/market-managed-online-quran-tutoring-marketplace-research-2026-07-19.md
colors:
  background: '#EEF2F0'
  on-background: '#122018'
  surface: '#F7FAF8'
  surface-elevated: '#FFFFFF'
  surface-muted: '#E2EAE5'
  on-surface: '#122018'
  on-surface-muted: '#4A5C52'
  primary: '#0F3D32'
  on-primary: '#F7FAF8'
  primary-hover: '#0A2E26'
  accent: '#C4A35A'
  on-accent: '#122018'
  accent-soft: '#F3EBD7'
  success: '#1F6B4A'
  on-success: '#FFFFFF'
  warning: '#9A6B1F'
  on-warning: '#FFFFFF'
  error: '#A33B2C'
  on-error: '#FFFFFF'
  outline: '#C5D0C9'
  outline-strong: '#0F3D32'
  verified: '#0F3D32'
  focus-ring: '#2F6F5E'
typography:
  brand:
    fontFamily: Fraunces
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: '-0.02em'
  display:
    fontFamily: Fraunces
    fontSize: 48px
    fontWeight: '500'
    lineHeight: '1.12'
    letterSpacing: '-0.02em'
  display-mobile:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.15'
  headline:
    fontFamily: Fraunces
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.25'
  title:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  body:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0.04em'
  arabic-preview:
    fontFamily: 'Noto Naskh Arabic'
    fontSize: 22px
    fontWeight: '400'
    lineHeight: '1.8'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  full: 9999px
spacing:
  '1': 0.25rem
  '2': 0.5rem
  '3': 0.75rem
  '4': 1rem
  '5': 1.5rem
  '6': 2rem
  '8': 3rem
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2rem
  section: 4rem
components:
  button-primary:
    background: '{colors.primary}'
    color: '{colors.on-primary}'
    rounded: '{rounded.md}'
    font: '{typography.label}'
  button-secondary:
    background: transparent
    color: '{colors.primary}'
    border: '{colors.outline-strong}'
    rounded: '{rounded.md}'
  badge-verified:
    background: '{colors.accent-soft}'
    color: '{colors.primary}'
    border: '{colors.accent}'
  card-listing:
    background: '{colors.surface-elevated}'
    border: '{colors.outline}'
    rounded: '{rounded.lg}'
  input:
    background: '{colors.surface-elevated}'
    border: '{colors.outline}'
    focus: '{colors.focus-ring}'
    rounded: '{rounded.DEFAULT}'
---

# Quran Tutor Marketplace — Design Spine

`[ASSUMPTION: visual identity below — stakeholder did not specify brand; review and override freely. Avoids purple SaaS and cream/terracotta clichés.]`

## Brand & Style

**Posture:** Calm authority. A managed marketplace for something sacred — Quran learning for children — so the UI should feel steady, clear, and adult-trustworthy, never playful-edtech or aggressive marketplace flash.

**Brand signal:** Product name is a **hero-level** presence on the marketing landing (not a tiny nav wordmark). Supporting headline is secondary.

**Atmosphere:** Soft sage-tinted light field `{colors.background}` with a deep ink-green primary `{colors.primary}`. Sparse gold `{colors.accent}` only for verification and trust marks — never as wallpaper. Subtle gradient or soft botanical/geometry wash behind the first viewport only; content stays high-contrast and readable.

**Anti-references:** Generic purple gradients; neon glows; dark-mode-first; dense newspaper columns; emoji-heavy marketing; “Islamic clipart” overload; card grids as the hero.

## Colors

| Token | Role |
|---|---|
| `{colors.primary}` | Primary actions, nav active, verified ink |
| `{colors.accent}` | Verified badge edge, sparse trust highlights |
| `{colors.background}` | Page canvas (cool sage-light, not warm cream) |
| `{colors.surface-elevated}` | Panels, listing cards, forms |
| `{colors.success}` / `{colors.error}` / `{colors.warning}` | Attendance, cases, validation — never decorative |

Do not use accent gold for large fills or primary CTAs.

## Typography

- **Brand / display:** Fraunces — editorial warmth without costume “mosque font.”
- **UI / body:** Plus Jakarta Sans — clear for parents on mobile worldwide.
- **Arabic samples on listings:** Noto Naskh Arabic — for tutor intro snippets only, not English UI.

One display headline per viewport max. Body never drops below 16px for parent-critical copy.

## Layout & Spacing

- Max content width ~1120px for app shells; marketing can go full-bleed hero.
- Mobile-first; filters collapse into a sheet on small screens.
- Section rhythm `{spacing.section}`; card padding `{spacing.5}`.
- Landing first viewport: **brand + one headline + one supporting sentence + CTA group + full-bleed atmospheric plane** — no stats row, no tutor grid in the hero.

## Elevation & Depth

Prefer border + tonal shift over heavy shadows. One soft shadow on floating sheets/modals only. No multi-layer glow stacks.

## Shapes

`{rounded.md}`–`{rounded.lg}` for cards and buttons. Avoid pill-everything (`rounded.full` reserved for small status dots and avatars).

## Components

| Component | Visual notes |
|---|---|
| Primary button | `{components.button-primary}` — solid ink green |
| Secondary button | Outline primary; used for Rematch / secondary paths |
| Verified badge | `{components.badge-verified}` — short label “Verified” |
| Listing card | Photo/video thumb, name, badge, languages, rate, rating — no clutter chips pile |
| Filter chip | Selected = primary fill; unselected = outline |
| Trust strip | Compact: “Platform payments · Parent-visible chat · Free rematch” — text, not sticker badges on hero media |

## Do's and Don'ts

**Do**
- Lead with brand on marketing.
- Make verification and platform-payment trust visible before checkout.
- Keep child-related flows visually calm (no aggressive urgency timers).

**Don't**
- Put floating promo stickers on hero imagery.
- Instruct or imply paying tutors off-platform.
- Use dark mode as default.
- Use purple/indigo SaaS gradients or terracotta-on-cream editorial kitsch.

## Finalize notes

- Visual identity accepted as working  baseline for architecture/implementation unless brand work overrides.
- Reviewer Gate skipped; mocks deferred (spine-only).
- Finalized: 2026-07-19
