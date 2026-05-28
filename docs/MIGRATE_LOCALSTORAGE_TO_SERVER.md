Migration: localStorage → server-side attempts

Overview

This document explains the migration from client-side `localStorage` fallbacks (hold/payment caches) to a server-authoritative approach using a `clientAttemptId` persisted in `sessionStorage`.

Why migrate

- localStorage is global to the browser profile and causes stale/duplicate state across tabs.
- Server-side canonical state prevents race conditions and supports idempotency and reliable hydration after reloads.

What changed (summary)

- Backend
  - `Booking` and `BookingSlotLock` now support `clientAttemptId`.
  - `POST /api/public/shops/:slug/hold-slot` accepts optional `clientAttemptId` and stores it on temp holds.
  - `POST /api/public/shops/:slug/bookings` accepts `clientBookingAttemptId` and returns existing booking if present (idempotency).
  - `GET /api/public/shops/:slug/booking-attempts/:attemptId` returns a booking/payment or temporary hold associated with the attempt id.

- Frontend
  - Client generates a `client_attempt_{slug}` UUID and stores it in `sessionStorage` (per-tab).
  - Frontend sends `clientAttemptId` with `hold-slot` and `bookings` requests.
  - Payment page hydrates canonical state from `GET /booking-attempts/{attemptId}` if available.
  - All localStorage reads/writes for `hold_token_*`, `hold_expires_*`, `last_booking_code_*`, `last_payment_data_*`, `last_booking_expires_*` were removed or replaced by server/session logic.

Short migration steps (for deploy)

1. Deploy backend changes first (supporting `clientAttemptId` and `GET /booking-attempts/:id`).
2. Deploy frontend changes that send `clientAttemptId` and hydrate via the new endpoint.
3. Monitor logs for any 409 conflicts and clientAttempt lookups — resolve if unexpected.
4. After both sides are live, you may remove any leftover UI that referenced legacy `localStorage` keys.

Validation

- End-to-end:
  - User selects slot → app sends `hold-slot` with `clientAttemptId` and receives hold.
  - Reload tab → payment page hydrates from `/booking-attempts/{attemptId}` and shows payment UI.
  - Multiple submits with same `clientBookingAttemptId` should return the same booking (no duplicates).

- Quick API checks:
  - `GET /api/public/shops/:slug/booking-attempts/:attemptId` returns `hold` or `booking`.

Rollback plan

- If frontend deploy causes issues, revert frontend while backend still accepts `clientAttemptId` (backward compatible).

Notes and next steps

- Consider purging or migrating any persisted legacy `localStorage` keys in analytics or with a migration job.
- Consider adding TTL/cleanup for unused `clientAttemptId`s in the DB or an index to track usage.

Contact

- Reach out to the engineering team for questions or to add observability for the new endpoints.
