# Quran Tutor Marketplace

Global managed marketplace connecting families with verified Quran tutors. Standard currency: USD.

## Stack

- Next.js 16.2 (App Router) · React 19 · TypeScript · Tailwind CSS 4
- Firebase (Auth/Firestore/Storage) and Stripe — configure via `.env.local` (see `.env.example`)

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Firebase auth notes

This project uses Firebase Auth action links for email verification and password reset.
Set your Firebase Auth authorized domain(s) and email templates in Firebase Console.

Auth callbacks in this app are handled at `/auth/confirm`.

### External accounts (when you need them)

1. **Firebase** — create a project; add Web App config and Admin service account creds to `.env.local`
2. Deploy Firebase rules/indexes in this repo:
   - `firestore.rules`
   - `storage.rules`
   - `firestore.indexes.json`
3. Configure Firebase Authentication action links to return to `http://localhost:3000/auth/confirm`
4. **Stripe** — create an account; keys needed for checkout (Epic 5)
5. **Resend** — email delivery for notifications (optional)

Registration UI: [/register](http://localhost:3000/register) — works once env is set.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

## Project layout

See Architecture Structural Seed: `app/(marketing|auth|parent|tutor|admin)`, domain logic under `src/`, Firebase rules at project root.

Planning artifacts live in `_bmad-output/` (not runtime).
