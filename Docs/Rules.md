# PresenTap — Engineering Rules

**Status:** Strict Engineering Rulebook
**Applies to:** All MVP implementation by any developer or Claude Code session.
**Companion docs:** `PRD.md`, `Architecture.md`, `Backend Schema.md`, `Phases.md`, `Design.md`.

> These rules are mandatory. Where a rule and a convenience conflict, the rule wins. Ambiguities are resolved by the priority order in `PRD.md` task brief: **Security → Reliability → MVP simplicity → Maintainability → Future extensibility.**

---

## 4.1 Project Rules

- `PRD.md` is the **product** source of truth. Do not implement features it does not define for the MVP.
- `Architecture.md` is the **architecture** source of truth.
- `Backend Schema.md` is the **database** source of truth.
- `Design.md` is the **UI** source of truth.
- `Phases.md` controls **implementation order**; follow phase dependencies.
- **No scope creep.** The MVP is exactly: Web App + Supabase (Auth/Postgres/Realtime) + Backend API + ESP8266 NodeMCU + RC522 + RFID cards.
- **No unnecessary abstraction.** Add a layer only when it earns its place.
- **No undocumented architectural changes.** Change the docs first, then code. Keep `Architecture.md` / `Backend Schema.md` in sync with reality.
- Out-of-scope items (face, phone, RPi, ESP32-CAM, QR, fingerprint, GPS, parent/student apps, fees, exams, timetable, payroll, SMS/WhatsApp, AI assistant, marketplace, universal flashing) appear **only** in clearly labeled *Future / Post-MVP* sections.

---

## 4.2 Code Rules

- **TypeScript strictness:** `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`. Treat `any` as a review-blocking smell.
- **Naming conventions:**
  - `camelCase` for variables/functions; `PascalCase` for components/types/classes; `SCREAMING_SNAKE` for constants.
  - DB columns: `snake_case`. TS types mirror columns in `snake_case` (or mapped via a thin mapper).
- **File naming:** `kebab-case.ts` for modules; `PascalCase.tsx` for components; route folders per App Router conventions.
- **Component naming:** descriptive, no abbreviation (`AttendanceTable`, not `AttTbl`).
- **Function naming:** verb-led (`markAttendance`, `resolveStudentByUid`).
- **Constants:** centralize magic values in `lib/constants.ts` (e.g., `OFFLINE_TIMEOUT_SECONDS = 90`, `ENROLLMENT_TTL_SECONDS = 300`).
- **Error handling:** never swallow errors; return typed results; let the API layer produce safe envelopes.
- **Async behavior:** `await` explicitly; avoid floating promises; handle rejections.
- **Dependency discipline:** add a dependency only with justification; prefer Supabase/Next/shadcn built-ins over new libs.
- **No dead code:** delete unused exports, flags, and console logs before merge.
- **No duplicated business logic:** attendance/RFID/device rules live in `lib/*/service.ts`, never re-implemented in UI or routes.

---

## 4.3 Frontend Rules

- **Accessibility:** semantic HTML; all interactive controls keyboard-operable; visible focus rings; ARIA only where native semantics are insufficient; `label` for every input; 4.5:1+ contrast.
- **Responsive:** mobile-first; dashboard sidebar collapses to a bottom nav / hamburger < 768px; tables scroll or stack on small screens.
- **Form validation:** client-side for UX **and** server-side (Zod) as the authority. Show field-level errors.
- **Loading states:** skeletons matching layout; disable submit while pending.
- **Empty states:** explicit, illustrated empty states with a primary CTA (no blank screens).
- **Error states:** inline `Alert` + toast; user-actionable message; never expose stack traces or DB errors.
- **Reusable components:** build from `components/ui/*` primitives; do not inline one-off styled divs for standard controls.
- **Server/client boundaries:** fetch initial data in Server Components; keep mutations/realtime in Client Components; never call device endpoints from the browser.
- **API usage:** human reads/writes go through the Supabase anon client (RLS). Never embed service-role key in client code.

---

## 4.4 Backend Rules

- **Zod validation:** every route parses body/headers/params with Zod before any logic; invalid → `400`.
- **Consistent API responses:** use the envelope `{ success, status?, data?, message?, error?: { code, message } }`.
- **Authentication checks:** human routes verify the Supabase session; device routes call `authenticateDevice` and derive org/class from the device row.
- **Device authentication:** HMAC-verify device token; compare in constant time; reject `invalid_device`/`disabled_device`.
- **No UI-level database business logic:** all attendance/RFID/device rules in `lib/*/service.ts`.
- **Centralized error handling:** one `handleApiError` maps exceptions → safe envelope + status code; log server-side only.
- **Secure logging:** log request id, device id, outcome, latency. **Never log raw device token, service-role key, or Wi-Fi password.**

---

## 4.5 Database Rules

- **Migrations only:** schema changes via numbered migration files under `supabase/migrations/`. Never hand-edit the live DB; never edit a shipped migration—add a new one.
- **Foreign keys:** every reference has a FK; `ON DELETE RESTRICT` where deletion must be blocked; `CASCADE` only for `profiles → auth.users`.
- **Indexes:** add only the indexes in `Backend Schema.md` §7 (each has a stated reason). No speculative indexes.
- **Constraints:** enforce `uq_attendance_daily`, `uq_students_rfid_active`, `uq_students_roll_active`, and all CHECK enums.
- **RLS:** enable on all org-owned tables; policies use `current_org_id()`. No anon write policies.
- **Organization isolation:** every owned row carries `organization_id`; queries filter by it.
- **Timestamps:** `created_at`/`updated_at` `timestamptz` with `now()` defaults; `updated_at` via shared trigger.
- **Uniqueness:** RFID unique among active students per org; roll unique per class; device id globally unique; attendance unique per (student,class,date).
- **Database-enforced duplicate prevention:** the unique constraint is the guarantee; the API catches the violation and returns `already_present`. Do not rely on app checks alone.

---

## 4.6 Security Rules

Explicitly prohibited:
- **Service-role key in the frontend** (browser bundle, client env exposed to browser).
- **Service-role key in the ESP8266 firmware** (flash, config, serial).
- **Database passwords in firmware.**
- **Secrets in Git** (service-role key, `DEVICE_AUTH_SECRET`, Wi-Fi password, device token). Use `.env` (gitignored) + `.env.example` (empty).
- **Hardcoded credentials** in code.
- **Trusting user/device-supplied `organization_id`.** The API derives org from the authenticated device or the session user.
- **Unvalidated external input** — all device/human payloads Zod-validated.
- **Exposing internal errors** — return safe messages; log details server-side.
- **Disabling TLS verification** on the device HTTPS client in production.
- **Anonymous insert policies** on any owned table.

---

## 4.7 Firmware Rules

- **Secure HTTP:** use `WiFiClientSecure`/BearSSL; verify the server certificate; never `setInsecure()` in production builds.
- **Canonical RFID UID:** convert raw bytes to uppercase hex, no separators (`A3B71C92`). Do not trust reader-formatted strings.
- **Retry logic:** network/API failures use exponential backoff (1s→2s→4s… cap 30s). Bounded; never infinite tight loop.
- **Reconnect behavior:** on Wi-Fi loss, reconnect with backoff; surface offline; keep scanning safely.
- **Heartbeat:** send every 30–60s; include `uptime` and `wifi_rssi`.
- **Bounded resource usage:** avoid memory leaks; cap buffers; `yield()`/`delay()` in loops; no unbounded queues in MVP (offline queue is post-MVP).
- **No secret leakage in Serial output:** never `Serial.print` the raw token, Wi-Fi password, or full payload secrets. Debug logs must be compile-gated (`#ifdef DEBUG`).
- **Physical feedback:** beep/LED per `Architecture.md` §3.6; distinct signals for present/unknown/duplicate/offline.
- **Safe failure handling:** invalid card/response → error feedback, return to scan loop; never crash or hang.

---

## 4.8 Attendance Business Rules

- **First valid scan = present.** Exactly one `present` row per (student, class, date).
- **Duplicate scan = already present.** Second scan same day → `already_present`; no new row.
- **Unknown card = reject.** UID not linked to an active student → `unknown_card`; no row.
- **Wrong class = reject.** Student exists but not in the device's class → `wrong_class`; no row.
- **Archived student = reject.** `status='archived'` → `archived_student`; no row.
- **Disabled device = reject.** `status='disabled'` → `disabled_device`; no writes.
- **Server timestamp = authoritative.** `marked_at` = server time; `attendance_date` = server UTC date. Device `scanned_at` is metadata only.
- **Duplicate prevention at DB level.** Enforced by `uq_attendance_daily`; the API catches the violation.

---

## 4.9 API Rules

- **URL naming:** `kebab-case` paths under `/api`; device endpoints under `/api/device/*`.
- **HTTP methods:** `POST` for actions (heartbeat, attendance, rfid/register, create); `GET` for reads; `PATCH`/`DELETE` for updates where used.
- **Request schemas:** Zod-defined; documented in `Architecture.md` §3.5 and enforced.
- **Response format:** the standard envelope (`success`, `status`, `data`, `message`, `error`).
- **Status codes:** `200` for handled device outcomes (present/already_present/unknown_card/wrong_class); `400` malformed; `401` invalid/disabled device; `409` (reserved); `500` server error.
- **Error codes:** stable string codes (`invalid_device`, `disabled_device`, `unknown_card`, `wrong_class`, `archived_student`, `invalid_request`, `duplicate`).
- **Authentication:** human routes via Supabase session; device routes via `X-Device-Id` + `X-Device-Token` (HMAC-verified).
- **Validation:** Zod on every request; reject early.
- **Logging:** structured; no secrets (§4.4).

---

## 4.10 Testing Rules

- **Unit tests:** Zod schemas; `markAttendance` rules (duplicate, wrong class, archived, unknown); UID canonicalization; HMAC verify/rotate.
- **API tests:** each device + human endpoint with valid/invalid/malformed inputs and auth states (supertest/route tests).
- **Database/RLS tests:** org isolation (user A cannot read org B); unique constraints fire; archived/disabled rejection; partial unique indexes behave.
- **Integration tests:** full lifecycle — create org→class→student→device→register RFID→attendance→realtime event.
- **Firmware tests:** UID canonicalization; heartbeat payload; offline reconnect; debounce; feedback mapping (simulated client).
- **Hardware tests:** the mandatory physical acceptance test (`PRD.md` §36) — tap → read → send → validate → store → dashboard → duplicate returns `already_present`.
- **End-to-end test:** the 3–5 min hackathon demo flow (`PRD.md` §40) works without manual refresh.

---

## 4.11 Git Rules

- **Commit conventions:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`). Scoped where useful (`feat(device): ...`).
- **Branches:** short-lived feature branches off `main`; PRs for review; `main` always deployable.
- **Secrets:** `.gitignore` must exclude `.env`, `config.h` (firmware secrets), and any key file. Pre-commit scan for leaked secrets.
- **Pull requests:** require passing tests; review by another dev/Claude; no force-merge of failing checks.
- **Meaningful commits:** one logical change per commit; no "wip"; no mega-commits mixing schema + UI + firmware.
- **No generated junk:** ignore `node_modules`, `.next`, build artifacts, and IDE folders.

---

## 4.12 NEVER DO THIS (PresenTap anti-patterns)

- Never put the Supabase **service-role key** in the browser or the ESP8266.
- Never let the ESP8266 talk directly to Supabase (no anon key in firmware either, unless a future read-only display needs it — not in MVP).
- Never trust `organization_id` from a device or untrusted client.
- Never store the raw device token in the database or logs.
- Never disable TLS certificate validation on the device.
- Never create attendance rows without going through `markAttendance` (duplicate/validation rules).
- Never rely on app-level duplicate checks alone — the DB constraint is mandatory.
- Never use the ESP8266 clock as the official attendance date.
- Never expose stack traces, DB errors, or secrets to users or devices.
- Never add face/phone/RPi/QR/fingerprint/parent/student features into the MVP.
- Never write business logic in UI components or API route handlers (use `lib/*/service.ts`).
- Never skip RLS on an org-owned table.
- Never commit `.env`, `config.h`, or any secret.
- Never let a scan crash the firmware or hang the loop.
- Never build a feature that breaks the single complete loop: **configure → connect → tap → record → monitor**.
