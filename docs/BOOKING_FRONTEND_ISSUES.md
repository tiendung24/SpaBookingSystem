# Booking Frontend - Suspect Issues and Fixes

This document lists suspected problems in the frontend booking flow, practical reproduction notes, and recommended fixes. Each item points to files to inspect or change.

---

## 1) 409 error classification is not flexible
- Problem
  - The frontend currently treats a 409 response as "hold expired" when the error message contains substrings like "hết hạn", "expired" or "giữ chỗ". Backend may return 409 for other reasons (e.g. "Slot vừa được người khác giữ", "Slot đã được người khác vừa đặt"). The frontend may incorrectly treat such conflicts as an expired hold and clear the token, or show a generic alert.
- Files
  - `frontend/src/context/ShopContext.jsx` (function: `createBookingFromDraft` error handling/catch)
- Reproduction notes
  - Simulate a slot being taken by another user: open two browser tabs, hold a slot in tab A, then in tab B try to create the same booking.
  - Observe the backend 409 message and the frontend's behavior (does it clear token? show correct message?).
- Recommended fixes
  - In `createBookingFromDraft` catch block, distinguish 409 variants:
    - If message includes "hết hạn" / "expired" / "giữ chỗ" / "hold" → treat as expired hold (clear token, keep draft but clear hold fields).
    - If message indicates "slot taken" / "vừa được" / "đã được đặt" / "occupied/booked/taken" → treat as slot conflict: clear hold token and payment cache, unset `bookingDraft.time`, and throw/return a friendly error message like `Khung giờ vừa bị đặt. Vui lòng chọn khung giờ khác.`
    - Otherwise rethrow the original error to surface full message.
- Additional notes
  - Backend should aim to standardize conflict messages or return a structured error code in addition to text (e.g. `{ code: 'HOLD_EXPIRED' }`), which clients can use to reliably detect the cause.

---

## 2) Hold token / localStorage restore inconsistencies
- Problem
  - Frontend restores hold token and draft using `localStorage` keys `hold_token_{slug}`, `hold_expires_{slug}` and `public_booking_draft`. With multiple tabs, inconsistent expire formats (string vs ISO) or stale entries, restore logic may incorrectly reuse an expired token or present stale draft to users.
- Files
  - `frontend/src/pages/CustomerBookingTimePage.jsx` (restore logic + storedHold handling)
  - `frontend/src/context/ShopContext.jsx` (loadStoredBookingDraft and related localStorage write/cleanup)
- Reproduction notes
  - Set a hold token in one tab, then let it expire; reload another tab and observe whether it incorrectly restores a stale token.
- Recommended fixes
  - Normalize `expiresAt` parsing using `new Date(...)` and guard for invalid dates.
  - When restoring from localStorage verify `expiresAt > Date.now()` before applying.
  - When storing `hold_expires_{slug}`, always store as ISO string (`new Date().toISOString()`). Document the format.
  - Consider storing an explicit `hold_created_at` and `hold_ttl_seconds` to compute expiry robustly (avoid client-server clock skew issues).
  - Improve cleanup: only remove `hold_token_{slug}` when it's confirmed expired by server or by robust local check.

---

## 3) Client-side fallback for available slots when backend returns []
- Problem
  - If `GET /api/public/shops/:slug/available-slots` returns `[]`, frontend falls back to computing slots using `shop.hours` + `bookings`. This may disagree with server logic (e.g. plan.isClosed, special locks), leading to UI showing available slots that server forbids and causing 409 when booking.
- Files
  - `frontend/src/pages/CustomerBookingTimePage.jsx` (slots calculation)
  - `backend/src/controllers/public/shops.controller.js` (server implementation of available slots)
- Reproduction notes
  - Make server return empty slots for a date (shop closed or locked) and confirm frontend still shows slots due to fallback calculation.
- Recommended fixes
  - Do not silently fallback when server returns `[]`. Instead:
    - If backend returns `{ date, slots: [] }` treat that as authoritative and show "no slots".
    - If backend returns an explicit error (e.g. closed), show server reason instead.
    - If backend is unreachable (network error), allow a local fallback but mark it as "offline fallback" and warn the user the result is not authoritative.
  - Alternatively, merge server slots with client calculation only when server indicates partial data or provides a flag `partial: true`.

---

## 4) Idempotency / duplicate booking on reload
- Problem
  - Payment page (`CustomerPaymentPage.jsx`) auto-invokes `createBookingFromDraft` on mount. If the user reloads or network is unreliable, multiple booking creation calls may occur. The frontend partially mitigates with `last_booking_code_{slug}` in localStorage but this is brittle.
- Files
  - `frontend/src/pages/CustomerPaymentPage.jsx` (auto-create on mount)
  - `frontend/src/context/ShopContext.jsx` (createBookingFromDraft)
- Reproduction notes
  - Trigger network slowness or reload the payment page repeatedly and observe multiple bookings created in DB.
- Recommended fixes
  - Implement client-side idempotency key: generate a random `clientBookingId` when user initiates a booking attempt and persist it to `public_booking_draft`. Send that to the server with booking create request; server should store and ignore duplicate requests with same `clientBookingId` for a short window.
  - If server can't change, strengthen client guard: check `localStorage.last_booking_code_{slug}` before calling createBookingFromDraft, and treat server responses that already created a booking idempotently.
  - On `createBookingFromDraft` success, persist booking code and response; on failure vs 409, don't immediately retry without user action.

---

## 5) Mismatch messages / UX when slot is held/ booked
- Problem
  - Backend returns different messages for conflict cases but frontend mostly shows a generic alert. Users need clearer guidance: when to reselect time, when to retry, and whether payment may still be processed.
- Files
  - `frontend/src/context/ShopContext.jsx` (createBookingFromDraft error handling)
  - `frontend/src/pages/CustomerBookingTimePage.jsx` (confirmation flow + UI messaging)
  - `backend/src/controllers/public/shops.controller.js` (various 409 messages like "Nhân viên đã kín lịch" or "Hiện không còn nhân viên trống")
- Recommended fixes
  - Standardize server error payloads with a `code` field (e.g. `HOLD_EXPIRED`, `SLOT_CONFLICT`, `STAFF_BUSY`, `SHOP_CLOSED`) so clients can branch on `code` reliably instead of parsing text messages.
  - Improve frontend alert messages to be specific and actionable, e.g.:
    - HOLD_EXPIRED → "Giữ chỗ tạm đã hết hạn. Vui lòng chọn lại khung giờ."
    - SLOT_CONFLICT → "Khung giờ vừa bị đặt. Vui lòng chọn khung giờ khác."
    - STAFF_BUSY → "Nhân viên đã kín lịch. Vui lòng chọn nhân viên khác hoặc chọn 'Ngẫu nhiên'."
  - Optionally show suggestions (e.g. nearest available slots) when conflict occurs.

---

## 6) Additional areas to inspect
- Local timezone/format mismatch: ensure frontend sends `date` in `YYYY-MM-DD` and `time` in `HH:mm` exactly as backend expects.
- Clock skew: consider server telling clients expiry TTL instead of absolute time to reduce clock skew issues.
- Logging & debug aids: instrument `window.__lastBookingPayload`, `window.__lastBookingRes`, `window.__lastBookingError` (already present) and make them clearer for QA.

---

## Quick checklist for immediate fixes (apply in order)
1. Tighten `createBookingFromDraft` error classification (see 1).
2. Make restore token logic strict about ISO expiry parsing and only restore if expiry > now (see 2).
3. Remove silent fallback for available slots; treat server empty result as authoritative (see 3).
4. Add a client `clientBookingId` idempotency field for booking create or strengthen local last_booking_code guard (see 4).
5. Standardize server error codes or parse messages defensively and improve frontend UX messages (see 5).

---

## Suggested follow-ups
- Backend: return structured error payloads for conflicts and hold expiry with machine-readable `code`.
- Frontend: add auto-redirect from payment page to time selection on slot conflict, and a clearer restore flow for stale tokens.

---

If you want, I can:
- Apply the recommended frontend patches incrementally (I already applied createBookingFromDraft improvements and admin try/catch).
- Draft a backend PR to add structured error codes for conflict cases.
- Add end-to-end test scripts to reproduce common races (hold->create booking conflicts).

Which next step should I take?