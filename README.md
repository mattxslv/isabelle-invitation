# Isabelle's First Birthday & Christening invitation

Mobile-first watercolor invitation with private RSVPs, a godparent letter, and a family dashboard.

| Route | What it is |
| --- | --- |
| `/` | The invitation: hero and countdown, christening, reception, details, RSVP, thank you |
| `/godparents` | Scroll-opened envelope letter, generic "Will you be my godparent?" |
| `/godparents/ninang`, `/godparents/ninong` | Same letter, addressed to a Ninang or Ninong |
| `/godparents/invite/<token>` | Private personal link that greets someone by name (created in the dashboard) |
| `/admin` | Family-only dashboard: RSVP counts, search, delete, godparent answers, personal links |

All event facts and copy live in **`src/content/event.ts`**.

## Stack

Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4, Zod, Neon Postgres.
Local development and tests use PGlite (Postgres compiled to WASM), so the same SQL runs everywhere.

## Getting started

```bash
npm install
cp .env.example .env.local      # fill in DATABASE_URL (Neon, pooled) and RATE_LIMIT_SALT
npm run db:migrate              # applies db/schema.sql
npm run admin:create -- you@example.com   # prompts for a password (min 12 chars)
npm run dev
```

If `DATABASE_URL` is empty, development uses a local database in `.data/pglite`.

### Family admins

The allowlist **is** the `admin_users` table. Only people added with `npm run admin:create` can sign in. Running the
command again for the same email resets the password and signs out their other sessions. No credentials live in code.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | Validation, cutoff, countdown, RSVP storage, duplicates, rate limiting, admin auth, godparents, RLS |
| `npm run lint` / `typecheck` | ESLint, TypeScript |
| `npm run photos` | Rebuild optimized photos from `private/originals` (local only, strips metadata) |
| `npm run art` | Re-render the watercolor artwork to `public/art` (add `--preview` for contact sheets) |

## Privacy and security notes

- **Child photos:** originals live only in `private/` (gitignored). Only resized, metadata-free crops are in `public/photos`. Nothing is sent to third-party image services.
- The whole site sends `noindex` (meta and `X-Robots-Tag`).
- RSVPs are written only through server actions with Zod validation, a honeypot, Postgres-backed rate limiting (salted hashes, no raw IPs), and a server-side deadline check in Philippine time.
- Retries are idempotent (per-answer submission key). A second reply under the same name is stored and flagged, never silently overwritten.
- Admin sessions: scrypt password hashes, random 256-bit session tokens stored only as SHA-256 hashes, `HttpOnly` / `Secure` / `SameSite=Lax` (`__Host-` prefix in production), 7-day expiry. Every admin page and action re-checks the session on the server.
- Row level security is enabled on every table with no policies. The app connects as the table owner and is unaffected, while any other role (such as a future Data API) sees nothing. This is covered by tests.

## Before launch (blockers)

1. **Map pins:** both "Get Directions" links are provisional Google Maps searches (`map.verified: false` in `event.ts`). Confirm the exact pins with the family and replace them. The dashboard shows a reminder until both are verified.
2. **Photo permission:** get the family's approval to publish Isabelle's photos.
3. **RSVP deadline:** November 13, 2026, 11:59 PM Philippine time (family-confirmed).
4. **Retention:** decide when RSVP and godparent data will be deleted, then update the privacy line in `event.ts`.
5. **Admins:** create the real family accounts with `npm run admin:create`.
6. **Deploy:** set `DATABASE_URL` and `RATE_LIMIT_SALT` in the host's environment. This has not been deployed anywhere yet.
