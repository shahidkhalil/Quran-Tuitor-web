# UX / Design patterns (canonical for Epics 5–7+)

**Status:** Living reference — updated 2026-07-28  
**Audience:** Story authors + implementers  
**Also enforced by:** `.cursor/rules/marketplace-ui.mdc`

## 1. Visual identity

| Token | Role |
|-------|------|
| Forest green `#0d4a3a` | Primary CTAs, sidebar, verified accents |
| Gold `#c9a227` / soft `#f7f0d8` | Eyebrows, free-trial badges, highlights |
| Soft green-gray background `#f4f7f5` | App canvas |
| Fraunces | Display titles (`.display-title`) |
| Plus Jakarta | Body / UI |

Avoid: purple/indigo AI defaults, cream+terracotta newspaper looks, Inter/Roboto as brand fonts, glow-heavy dark mode.

## 2. Panel dashboard pattern (parent, tutor, admin)

```
┌──────── sidebar ────────┬──────── content ─────────────┐
│ Avatar + workspace name │ Glass header + bell + utility│
│ Nav (icons)             │ PanelPageHeader              │
│ Sign out                │ Stats / cards / forms        │
└─────────────────────────┴──────────────────────────────┘
```

- **Home:** status sentence + 3-up stats + interactive `surface-card` grid.
- **Lists:** `surface-card` rows + `status-pill-*` (warning / success / error / accent).
- **CTAs:** `.btn-panel-primary` / secondary (pill), or shared `Button`.
- **Notifications:** header bell dropdown only — never a “Notifications” section on home.

## 3. Public tutor profile (Superprof-inspired)

1. Photo-first hero (mobile full-bleed; desktop portrait + identity strip).
2. Free trial badge + Verified + subject chips + rate.
3. Sections: About → Lessons → Availability → Kids experience → Video → Reviews.
4. Sticky book CTA: **Book free trial** (not Contact). Trust strip: platform payments.
5. Heart shortlist on photo (mobile icon variant).

## 4. Marketing

- Auth-aware nav: signed-in users see role dashboard CTA, not Sign in / Create account.
- Browse: card grid with photo/initials, verified chip, rate, shortlist.

## 5. Profile photos (all roles)

- Upload via Cloudinary (`uploadProfilePhoto` → `profiles.photo_url`).
- Surfaces: `/parent/account`, `/tutor/account`, `/admin/account`.
- Tutors: account photo syncs to listing; browse/detail fall back to profile photo.

## 6. Copy & product rules that affect UI

- Currency: **USD**.
- Never instruct paying the tutor directly.
- Free trial: no card; conversion uses platform checkout.

## 7. Checklist for new epic UI

- [ ] Uses existing shell for the role
- [ ] Tokens/utilities from `globals.css` (no one-off palette)
- [ ] `PanelPageHeader` + cards/pills consistent with home
- [ ] Loading: skeletons where lists load
- [ ] Mobile: sticky CTA only when booking/checkout critical
- [ ] Photos via Cloudinary + `UserAvatar` where identity shows
