# PresenTap — Phases (Implementation Roadmap)

**Status:** Implementation Order Source of Truth
**Companion docs:** `Architecture.md`, `Backend Schema.md`, `Rules.md`, `Design.md`, `PRD.md`.

> Build in this order. Each phase lists Objective, Dependencies, Tasks, Files/Modules, DB/API/UI/Firmware changes, Tests, Acceptance Criteria, Definition of Done, Risks, and Debugging Notes. Tasks are classified:
> - **P0** = mandatory for a working MVP
> - **P1** = mandatory for a polished hackathon demo
> - **P2** = optional polish

---

## MVP Critical Path

```text
Supabase
   ↓
Auth
   ↓
Organization
   ↓
Class
   ↓
Student
   ↓
Device
   ↓
ESP8266
   ↓
RC522
   ↓
RFID Registration
   ↓
Attendance API
   ↓
Database
   ↓
Realtime
   ↓
Dashboard
```

---

## Phase Dependency Graph

```text
Phase 0 (Repo/Tooling)
   ├─ Phase 1 (Supabase DB) ─┬─ Phase 2 (Auth + Org) ─┬─ Phase 3 (Classes & Students)
   │                         │                         │        │
   │                         │                         │        ├─ Phase 4 (Device Mgmt)
   │                         │                         │        │        │
   │                         │                         │        │        ├─ Phase 5 (ESP8266 FW)
   │                         │                         │        │        │        │
   │                         │                         │        │        │        ├─ Phase 6 (Device Auth+HB)
   │                         │                         │        │        │        │        │
   │                         │                         │        │        │        │        ├─ Phase 7 (RFID Reg)
   │                         │                         │        │        │        │        │        │
   │                         │                         │        │        │        │        │        └─ Phase 8 (Attendance API)
   │                         │                         │        │        │        │                 │
   │                         │                         │        │        │        │                 └─ Phase 9 (Live Dashboard)
   │                         │                         │        │        │                              │
   │                         │                         │        │        │                              ├─ Phase 10 (History & Reports)
   │                         │                         │        │        │                              ├─ Phase 11 (Security Hardening)
   │                         │                         │        │        │                              └─ Phase 12 (E2E Hardware Test)
   │                         │                         │        │        │                                       │
   │                         │                         │        │        │                                       └─ Phase 13 (Deploy & Demo Polish)
```

---

## Phase 0 — Repository & Tooling Foundation

**Objective:** Scaffold a clean Next.js + TypeScript + Tailwind + Supabase project with the prescribed structure.
**Dependencies:** none.
**Tasks (P0):** init Next.js 14 App Router + TS strict; add Tailwind, shadcn/ui, Lucide; add Supabase JS; add Zod; create `lib/`, `components/ui/`, `app/api/`, `supabase/migrations/`, `firmware/esp8266-rc522/`; `.env.example`; `.gitignore` (`.env`, `.next`, `node_modules`, `config.h`); ESLint/Prettier; basic CI running typecheck + lint.
**Files/modules:** project root, `package.json`, `tsconfig.json`, `tailwind.config.ts`, `app/layout.tsx`, `lib/supabase/`.
**DB/API/UI/Firmware:** none yet.
**Tests:** `tsc --noEmit` passes; lint passes.
**Acceptance:** `npm run dev` serves a placeholder; `supabase/` folder exists; secrets are gitignored.
**DoD:** reproducible local dev start; no secrets committed.
**Risks:** toolchain version drift — pin versions.
**Debugging:** if Supabase client fails to import, verify `@supabase/supabase-js` + SSR package versions.

---

## Phase 1 — Supabase Database

**Objective:** Implement the full MVP schema with RLS and indexes.
**Dependencies:** Phase 0.
**Tasks (P0):** write migrations 0001–0013 per `Backend Schema.md` §10 (extensions, organizations, profiles, classes, students + partial uniques, devices, attendance + `uq_attendance_daily`, device_events, rfid_enrollment_sessions, triggers, indexes, RLS + `current_org_id()`, seed). Apply via Supabase CLI / dashboard SQL.
**Files/modules:** `supabase/migrations/*.sql`, `supabase/seed.sql`.
**DB changes:** all tables, constraints, indexes, RLS (see `Backend Schema.md`).
**API/UI/Firmware:** none.
**Tests (P0):** migration applies cleanly; RLS test (org A user cannot read org B); unique constraints fire (duplicate attendance, duplicate RFID, duplicate roll); partial indexes respect `status`.
**Acceptance:** schema matches `Backend Schema.md`; RLS blocks cross-org access; seed loads.
**DoD:** all tables present, RLS enabled, indexes created, seed runs.
**Risks:** `gen_random_uuid()` requires `pgcrypto` — ensure extension enabled first.
**Debugging:** if RLS blocks legit reads, verify `profiles.organization_id` is set and `current_org_id()` returns correctly.

---

## Phase 2 — Authentication & Organization

**Objective:** Sign up/log in/log out, password reset, and organization creation during onboarding.
**Dependencies:** Phase 1.
**Tasks (P0):** Supabase Auth email/password; `/login`, `/signup`, `/forgot-password`; `middleware.ts` auth guard; on signup create `profiles` row; `/setup/organization` creates `organizations` + links `profiles.organization_id`; session persistence; logout.
**Files/modules:** `app/(auth)/**`, `app/setup/organization/page.tsx`, `lib/auth/`, `middleware.ts`.
**DB changes:** writes `profiles`, `organizations`.
**API changes:** none new (use Supabase Auth + anon client).
**UI changes:** auth pages + org setup; design per `Design.md`.
**Tests (P0):** signup→org created→profile linked; signup/login/logout; unauthenticated redirect.
**Acceptance:** admin can create account + institution; data isolated by org.
**DoD:** full auth loop + org creation; RLS isolates data.
**Risks:** race between auth user creation and profile/org linking — use a transaction/trigger or post-signup step.
**Debugging:** if RLS denies dashboard, check `profiles.organization_id` is non-null after onboarding.

---

## Phase 3 — Classes & Students

**Objective:** CRUD for classes and students with search/filter.
**Dependencies:** Phase 2.
**Tasks (P0):** `/dashboard/classes` + `[classId]` (create/edit/archive, student count); `/dashboard/students` + `[studentId]` (add/edit/archive, roll number, student identifier, RFID display state); search + class filter; list/detail UIs per `Design.md`.
**Files/modules:** `app/dashboard/classes/**`, `app/dashboard/students/**`, `components/classes/**`, `components/students/**`.
**DB changes:** inserts/updates to `classes`, `students` (validated by CHECK + partial uniques).
**API changes:** human CRUD routes (or server actions) under RLS.
**UI changes:** class & student pages; tables, dialogs, empty/loading states.
**Tests (P0):** create/edit/archive class; create/edit/archive student; roll uniqueness per class; search/filter.
**Acceptance:** admin can manage classes & students; archived hidden from active lists.
**DoD:** full class/student lifecycle; unique constraints enforced.
**Risks:** roll-number uniqueness UX — surface violation clearly.
**Debugging:** duplicate-roll error → show field message, do not 500.

---

## Phase 4 — Device Management

**Objective:** Register ESP8266 devices, assign to class, enable/disable, show status.
**Dependencies:** Phase 3.
**Tasks (P0):** `/dashboard/devices` + `[deviceId]` (create with name + class + type; generate `device.id` + raw token; show token once, masked; download config; enable/disable; last seen; firmware version). Token hash stored; raw token never persisted (per `Backend Schema.md` §9).
**Files/modules:** `app/dashboard/devices/**`, `app/setup/device/**`, `lib/device/service.ts`.
**DB changes:** `devices` insert with `device_token_hash`; `status` active/disabled.
**API changes:** `lib/device/service.ts` `createDevice` (token gen + HMAC hash), list, update, rotate, revoke.
**UI changes:** device list/detail, "show token once" UX, advanced/details section for tech info.
**Tests (P0):** device created with unique id + hash (raw not stored); disable blocks writes (later phase); token rotation.
**Acceptance:** device has unique id + secure credential; dashboard shows device status.
**DoD:** device lifecycle complete; credential model implemented.
**Risks:** leaking raw token in logs/UI after first show — gate strictly.
**Debugging:** if auth fails later, verify stored hash = HMAC(DEVICE_AUTH_SECRET, raw).

---

## Phase 5 — ESP8266 + RC522 Firmware

**Objective:** Firmware that connects Wi-Fi, reads RC522, sends heartbeats & scans over HTTPS.
**Dependencies:** Phase 4 (needs `config.h` values).
**Tasks (P0):** Arduino sketch: init serial + RC522 + Wi-Fi; load `config.h`; connect Wi-Fi w/ backoff; HTTPS client (BearSSL); scan loop → canonical UID → POST attendance or rfid/register by mode; heartbeat timer; physical feedback (LED/buzzer); offline detection + reconnect; mode toggle (button or serial). Hardware wiring per `PRD.md` §27 (RC522 3.3V).
**Files/modules:** `firmware/esp8266-rc522/src/**`, `include/config.example.h` (template; real `config.h` gitignored), `README.md`.
**DB changes:** none (firmware).
**API changes:** consumes Phase 6/8 endpoints.
**Firmware changes:** full sketch.
**Tests (P0):** UID canonicalization unit; heartbeat payload shape; simulated server responds; offline reconnect in lab.
**Acceptance:** device connects Wi-Fi, reads UID, sends HTTPS requests, gives feedback, reconnects.
**DoD:** firmware flashes and runs the scan loop + heartbeat.
**Risks:** SPI pin mismatch on specific board — verify pins (SDA D2, SCK D5, MOSI D7, MISO D6, RST D1) before release.
**Debugging:** no Wi-Fi → check `WiFi.status()`; no reads → check 3.3V power and SPI wiring; TLS fail → check cert/BearSSL config.

---

## Phase 6 — Device Authentication & Heartbeat

**Objective:** Secure device auth and the heartbeat endpoint; derive org/class server-side.
**Dependencies:** Phase 4, Phase 5.
**Tasks (P0):** `POST /api/device/heartbeat`; `authenticateDevice(req)` (HMAC verify, constant-time, derive org/class, reject invalid/disabled); update `last_seen_at`; respond `{success, server_time}`; online-state derivation.
**Files/modules:** `app/api/device/heartbeat/route.ts`, `lib/device/auth.ts`.
**DB changes:** updates `devices.last_seen_at`.
**API changes:** heartbeat endpoint + device auth middleware.
**UI changes:** device detail shows online/offline + last seen + rssi (Phase 4 UI refined).
**Tests (P0):** valid token → 200 + updates last_seen; wrong token → 401; disabled → disabled_device; malformed → 400.
**Acceptance:** dashboard shows device online after heartbeat; invalid creds rejected.
**DoD:** secure heartbeat + auth complete.
**Risks:** clock skew on device irrelevant (server time authoritative).
**Debugging:** device offline in UI → check last_seen update interval vs 90s threshold.

---

## Phase 7 — RFID Registration

**Objective:** Register a student's RFID through the device via a controlled enrollment session.
**Dependencies:** Phase 3, Phase 5, Phase 6.
**Tasks (P0):** `/setup/rfid/[studentId]`: admin selects device → API creates `rfid_enrollment_sessions` (pending, TTL 5 min); device in enroll mode POSTs `/api/device/rfid/register {uid}`; API validates active session for device, duplicate UID (partial unique), assigns `students.rfid_uid`, marks session completed; UI shows waiting→detecting→success/duplicate/states. 
**Files/modules:** `app/api/device/rfid/register/route.ts`, `lib/rfid/service.ts`, `lib/enrollment/service.ts`, `app/setup/rfid/[studentId]/page.tsx`.
**DB changes:** inserts/updates `rfid_enrollment_sessions`, updates `students.rfid_uid`.
**API changes:** enrollment session create + rfid/register endpoint.
**UI changes:** RFID registration experience per `Design.md` (waiting/detecting/success/duplicate/timeout/offline/cancelled).
**Tests (P0):** success assign; duplicate UID rejected (original unchanged); session expiry; assign to correct student only.
**Acceptance:** RFID UID registered & linked; duplicate rejected.
**DoD:** full enrollment flow with session safety.
**Risks:** session left pending → expire via TTL + periodic cleanup.
**Debugging:** "already assigned" → partial unique index; device sends to rfid/register only in enroll mode.

---

## Phase 8 — Attendance API

**Objective:** The core attendance event lifecycle with full validation + DB-enforced duplicates.
**Dependencies:** Phase 6, Phase 7.
**Tasks (P0):** `POST /api/device/attendance {uid, scanned_at}`; `markAttendance(device, uid)`: authenticate → resolve student → validate org/class/status → duplicate check (catch unique violation → `already_present`) → insert `attendance` (server date/time) → insert `device_events(attendance_scan)` → return typed result; map outcomes to envelope + status codes.
**Files/modules:** `app/api/device/attendance/route.ts`, `lib/attendance/service.ts`.
**DB changes:** inserts `attendance`, `device_events`.
**API changes:** attendance endpoint + service.
**UI changes:** none (dashboard consumes in Phase 9).
**Tests (P0):** present / already_present / unknown_card / wrong_class / archived_student / invalid_device; duplicate row NOT created; org consistency.
**Acceptance:** valid scan stored; duplicates blocked; invalids rejected.
**DoD:** complete attendance lifecycle + duplicate prevention.
**Risks:** race creating two rows before unique violation — acceptable (constraint is the guarantee).
**Debugging:** unknown_card → verify UID canonicalization matches stored value (case/format).

---

## Phase 9 — Live Dashboard

**Objective:** Realtime dashboard answering present/absent/working/recent.
**Dependencies:** Phase 8.
**Tasks (P0):** `/dashboard` overview (total/present/absent/rate cards, recent attendance, class overview, device health); Supabase Realtime subscription to `attendance` INSERT + `devices` UPDATE (org-scoped); subtle insertion animation; no manual refresh.
**Files/modules:** `app/dashboard/page.tsx`, `components/dashboard/**`, `lib/realtime/`.
**DB changes:** none.
**API changes:** none (realtime direct).
**UI changes:** full dashboard per `Design.md`.
**Tests (P0):** a device scan updates counts + feed within ~3s without refresh; device online badge updates.
**Acceptance:** dashboard updates live; counts correct.
**DoD:** realtime dashboard complete.
**Risks:** realtime channel auth — ensure anon client can subscribe within RLS; fallback periodic refetch if realtime drops.
**Debugging:** no live update → verify Realtime enabled on table + correct org filter + anon policy allows SELECT.

---

## Phase 10 — Attendance History & Reports  (P1)

**Objective:** Historical views + CSV export.
**Dependencies:** Phase 9.
**Tasks (P1):** `/dashboard/attendance` history (date filter, class filter, student search); `/dashboard/reports` daily/date-range/student/class reports; CSV export with columns Date, Student Name, Roll Number, Class, Status, Marked At, Device (`PRD.md` §23.4); student/class detail attendance tabs.
**Files/modules:** `app/dashboard/attendance/**`, `app/dashboard/reports/**`, `lib/reports/export.ts`.
**DB changes:** none.
**API changes:** report queries (org-scoped); CSV generation.
**UI changes:** history + reports pages; export button.
**Tests (P1):** report counts match; CSV columns correct; absent derived correctly.
**Acceptance:** daily/student/class reports viewable; CSV exports.
**DoD:** reporting + export complete.
**Risks:** large exports — stream/paginate.
**Debugging:** wrong absent count → ensure only active students counted and present via LEFT JOIN.

---

## Phase 11 — Security Hardening  (P1)

**Objective:** Lock down secrets, rate limits, input validation, audit logging.
**Dependencies:** Phases 4–9.
**Tasks (P1):** confirm no service-role key in browser/firmware; `.env`/`.gitignore` audit; per-device rate limiting on device endpoints; tighten Zod schemas; secure logging (no secrets); review RLS policies; add `device_events` error logging; pre-commit secret scan.
**Files/modules:** `lib/security/**`, API routes, CI.
**DB changes:** none (maybe add audit trigger if needed).
**API changes:** rate-limit middleware; stricter validation.
**UI/Firmware:** none.
**Tests (P1):** secret-scan passes; rate limit triggers; RLS cross-org still blocked; no token in logs.
**Acceptance:** security review clean; rate limits active.
**DoD:** hardening complete; no secrets leakable.
**Risks:** rate limit too strict → device retries; tune windows.
**Debugging:** 429s → widen window or move to Upstash for multi-instance.

---

## Phase 12 — End-to-End Hardware Testing  (P0)

**Objective:** Pass the mandatory physical acceptance test (`PRD.md` §36).
**Dependencies:** Phases 5–9.
**Tasks (P0):** run the hardware acceptance test end-to-end: power ESP8266 → Wi-Fi → dashboard online → tap registered card → read UID → HTTPS → validate → store → dashboard updates → present; tap again → `already_present`, no 2nd row. Repeat with unknown/wrong-class/disabled scenarios.
**Files/modules:** `firmware/`, test checklist.
**DB changes:** none.
**API/Firmware/UI:** validated as integrated.
**Tests (P0):** full §36 test passes; duplicate prevention verified on hardware.
**Acceptance:** the physical loop works exactly as `PRD.md` §43 defines a working MVP.
**DoD:** hardware acceptance test green.
**Risks:** field RF interference, power noise — use 3.3V stable supply; test multiple cards.
**Debugging:** scan not received → check API URL, TLS, device token, network; duplicate not blocked → verify `uq_attendance_daily` exists.

---

## Phase 13 — Deployment & Demo Polish  (P1/P2)

**Objective:** Production-like deploy + smooth 3–5 min hackathon demo.
**Dependencies:** Phases 10–12.
**Tasks (P1):** deploy Next.js + Supabase; env vars in host secret store; landing page `/` (Tap. Record. Done.); onboarding wizard; hardware setup guide (`docs/hardware-setup.md`); `(P2)` animations, branding refinements, empty/error polish.
**Files/modules:** `app/(marketing)/page.tsx`, `app/setup/**` wizard, `docs/**`.
**DB/API:** none major.
**UI changes:** landing, wizard, setup guides, polish.
**Tests (P1):** deployment smoke test; demo flow runs in <5 min.
**Acceptance:** public landing + deployed app; demo works reliably.
**DoD:** shippable demo; MVP freeze lifted only after Phase 12 passes.
**Risks:** demo hardware flakiness — have a backup device + pre-seeded demo org.
**Debugging:** deploy 500s → check env vars, Supabase URL/keys, RLS.

---

## MVP Freeze

The following MUST NOT be added until the MVP passes the hardware acceptance test (Phase 12):

- Face / phone / laptop camera attendance
- Raspberry Pi / ESP32-CAM support
- QR / fingerprint / GPS attendance
- Parent or student applications
- Fees, exams, timetable, payroll
- SMS / WhatsApp / email notifications
- AI assistant / hardware advisor
- Automatic firmware OTA / universal browser flashing
- Complex multi-level permissions
- Biometric data storage
- Multi-campus / enterprise features
- Offline attendance queue (post-MVP reliability work)

Adding any of these before Phase 12 turns a verifiable hardware loop into an unverified feature set and violates the MVP scope lock.
