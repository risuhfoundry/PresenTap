# PresenTap — Architecture

**Status:** Technical Architecture Source of Truth
**Scope:** MVP only — ESP8266 + RC522 RFID attendance on Next.js + Supabase.
**Companion docs:** `PRD.md` (product), `Backend Schema.md` (DB), `Rules.md` (rulebook), `Phases.md` (order), `Design.md` (UI).

> Any decision here that conflicts with `PRD.md` is wrong — fix this file, not the PRD. Canonical cross-cutting decisions (device credential model, enums, API contracts) live in `Backend Schema.md` §2 and are binding here.

---

## 3.1 Overview

PresenTap turns an inexpensive ESP8266 + RC522 RFID reader into a reliable, cloud-connected attendance station for schools and colleges. A non-technical administrator manages everything from a clean web dashboard: create the institution, add classes and students, register each student's RFID card through the device, connect the hardware, and watch attendance appear in near real time.

The system has **two trust domains**:

1. **Human domain** — administrators (and optional teachers) authenticate with Supabase Auth and operate through the Next.js web app. Data access is governed by Row-Level Security (RLS) keyed on the user's organization.
2. **Device domain** — the ESP8266 is *not* a Supabase user. It proves its identity with a device-specific credential and talks only to the Next.js API, which is the single trusted bridge to the database. The device never holds, and never needs, a Supabase key.

The backend is the source of truth: it resolves RFID UIDs to students, validates the attendance event against organization/class/student rules, enforces duplicate prevention, stamps a server-authoritative timestamp, and pushes the result to the dashboard over Supabase Realtime.

---

## 3.2 High-Level Architecture

```text
                    ┌───────────────────────┐
                    │     Web Browser       │
                    │   Admin Dashboard     │
                    │   (Next.js client)    │
                    └───────────┬───────────┘
                                │ HTTPS
                                ▼
                    ┌───────────────────────┐
                    │    Next.js App        │
                    │ UI (App Router)       │
                    │ + API Routes (server) │
                    │ + Zod validation      │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │ Supabase                            │
              │ Auth (humans)                      │
              │ PostgreSQL + RLS (org isolation)    │
              │ Realtime (attendance / device feed) │
              └────────────────────────────────────┘

      ┌───────────────────────────────┐
      │ ESP8266 + RC522               │
      │ Physical Attendance Device    │
      │ (device credential, NOT a     │
      │  Supabase user)               │
      └───────────────┬───────────────┘
                      │ HTTPS + Device Credential
                      ▼
             ┌───────────────────────────┐
             │ PresenTap API (Next.js)   │
             │ Device Gateway            │
             │  - verify device token    │
             │  - resolve/validate       │
             │  - insert via service role│
             │  - publish realtime       │
             └─────────────┬─────────────┘
                           │ service-role (server only)
                           ▼
                     Supabase DB
```

Two inbound paths to the database:
- **Human path:** Browser → Supabase anon client → PostgreSQL with RLS.
- **Device path:** ESP8266 → Next.js API (device auth) → Supabase service-role client → PostgreSQL.

---

## 3.3 Technology Stack

Concrete decisions (no alternatives unless noted as future).

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Web framework | **Next.js 14 (App Router)** | Single deployable for UI + API; server routes host the device gateway. |
| Language | **TypeScript** (`strict: true`) | Type safety across client/server/DB boundaries. |
| Styling | **Tailwind CSS** | Fast, consistent utility styling; pairs with shadcn. |
| UI components | **shadcn/ui** + **Lucide** icons | Accessible, composable primitives; professional look without bespoke CSS. |
| Auth | **Supabase Auth** | Email/password, session, password reset out of the box. |
| Database | **Supabase PostgreSQL** | Managed Postgres + RLS + Realtime in one. |
| Realtime | **Supabase Realtime** (Postgres Changes) | Live dashboard without polling. |
| API validation | **Zod** | Single source of request schemas, shared client/server. |
| Server logic | **Next.js Route Handlers** (`app/api/...`) | Hosts device gateway + human API. |
| Firmware | **Arduino framework** (ESP8266 core) | Standard for NodeMCU. |
| RFID library | **MFRC522** (GitHubCommunity/esp8266-MFRC522) | Reads RC522 over SPI. |
| Wi-Fi | **ESP8266WiFi** | NodeMCU Wi-Fi. |
| HTTP client | **WiFiClientSecure / BearSSL HTTPS** | TLS to the API (no plaintext). |
| Transport | **HTTPS + JSON REST** | Simple, firewall-friendly, secure. |

**Future (post-MVP, not in MVP):** face/phone/laptop attendance (browser camera), Raspberry Pi, ESP32-CAM, QR, fingerprint. The attendance API and `attendance.source` column are designed to absorb these without a schema break.

---

## 3.4 Frontend Architecture

### App Router structure
```
app/
  (marketing)/            → / (landing)
  (auth)/                 → /login, /signup, /forgot-password
  dashboard/
    layout.tsx            → sidebar + topbar shell, auth guard
    page.tsx              → /dashboard (overview)
    classes/ page.tsx + [classId]/page.tsx
    students/ page.tsx + [studentId]/page.tsx
    devices/ page.tsx + [deviceId]/page.tsx
    attendance/page.tsx
    reports/page.tsx
    settings/page.tsx
  setup/
    organization/page.tsx
    device/page.tsx + [deviceId]/page.tsx
    rfid/[studentId]/page.tsx
  api/
    device/heartbeat/route.ts
    device/attendance/route.ts
    device/rfid/register/route.ts
    (human API routes as needed: classes, students, devices, reports)
```

### Authentication boundary
- `(auth)` and `(marketing)` are public.
- `dashboard/*` and `setup/*` are wrapped in a server-side auth guard (`middleware.ts` + server component check). Unauthenticated users redirect to `/login`.
- Session uses Supabase Auth cookies; persists across reloads; logout clears the session.

### Dashboard architecture
- A `DashboardShell` (sidebar + topbar) in `dashboard/layout.tsx`.
- Page components are **Server Components** by default, fetching initial data via the Supabase anon client (RLS-scoped).
- Interactive widgets (live counts, recent feed) are **Client Components** that subscribe to Supabase Realtime and call Server Actions / API routes for mutations.
- A `RealtimeProvider` opens a single Realtime channel for `attendance` INSERTs and `devices` UPDATEs, scoped by organization.

### Component architecture
- `components/ui/*` — shadcn primitives (Button, Input, Card, Dialog, Table, Badge, Tabs, Alert, Toast, Skeleton, Dropdown, Select).
- `components/dashboard/*`, `components/students/*`, `components/classes/*`, `components/devices/*`, `components/attendance/*` — feature components built from primitives.
- Reusable, presentational components only; no business logic in UI beyond local form state.

### Server/Client boundaries
- Data fetching for initial render: Server Components → Supabase anon client (RLS).
- Mutations (create/edit/archive): Server Actions or fetch to API routes; validated with Zod on the server.
- Realtime + ephemeral UI state (toasts, modals, scan waiting): Client Components.

### Form handling
- `react-hook-form` + Zod resolver, or shadcn `Form`. Client validates for UX; **server always re-validates with Zod** (never trust client input).

### API communication
- Human ops: Supabase JS client (anon) for reads/writes governed by RLS.
- Device ops: **never** from the browser. Only the Next.js server calls device endpoints.

### Loading / error / empty states
- Loading: skeletons (`Skeleton`) matching final layout.
- Error: inline `Alert` + toast; never leak internal messages.
- Empty: dedicated empty-state component with action CTA (e.g., "Create your first class").

### Realtime subscriptions
- Subscribe to Postgres Changes on `attendance` (INSERT) and `devices` (UPDATE) for the org. Insert new rows into the local feed with a subtle animation; update online/offline badges from `last_seen_at`.

---

## 3.5 Backend Architecture (Next.js API)

### API route structure
```
app/api/
  device/
    heartbeat/route.ts          → POST /api/device/heartbeat
    attendance/route.ts         → POST /api/device/attendance
    rfid/register/route.ts      → POST /api/device/rfid/register
  classes/  students/  devices/ reports/  (human CRUD, RLS-scoped)
  setup/ organization/ device/ rfid/  (onboarding orchestration)
```

### Validation layer
- Every route begins with Zod parse of the body/headers. Invalid → `400` with a safe error code. No further processing.

### Authentication layer (human)
- Supabase Auth session from cookies; `current_org_id()` (DB function) scopes all queries via RLS.

### Device authentication layer
- Middleware/factory `authenticateDevice(req)`:
  1. Read `X-Device-Id` + `X-Device-Token` headers.
  2. Look up device by id (service-role client).
  3. Constant-time `HMAC_SHA256(DEVICE_AUTH_SECRET, token)` compare vs `device_token_hash`.
  4. Reject `401 invalid_device` on mismatch; `disabled_device` if `status='disabled'`.
  5. Returns `{ device, organization_id, class_id }`. The `organization_id` is **derived**, never read from the body.
- See `Backend Schema.md` §9 for the full model.

### Services (server-only modules under `lib/`)
- `lib/attendance/service.ts` — `markAttendance(device, uid)`: resolves student, validates org/class/status, checks duplicate (DB constraint is the guarantee), inserts, logs `device_events`, returns a typed result.
- `lib/rfid/service.ts` — `registerRfid(device, uid, sessionId)`: validates active enrollment session, duplicate UID, assigns UID to student.
- `lib/device/service.ts` — heartbeat handling, `last_seen_at` update, online-state computation, device creation + token generation.
- `lib/enrollment/service.ts` — create/expire enrollment sessions.
- `lib/realtime/` — helpers to publish/subscribe.

### Attendance service flow (see §3.8)
Business logic lives here, not in UI. The route handler is a thin wrapper: validate → authenticate device → call service → map result to response envelope.

### Error handling
- Centralized: a `handleApiError` returns the consistent envelope (`success:false`, `error.code`, safe `message`). Never return raw exceptions or DB errors to clients/devices.

### Logging
- Structured server logs (request id, device id, outcome, latency). **Never log the raw device token or service-role key.** Log only hashes/ids.

---

## 3.6 Hardware Architecture (ESP8266 + RC522)

### ESP8266 responsibility
- Connect to Wi-Fi (config from `config.h`).
- Periodically authenticate to the backend and send heartbeats.
- Run the RFID scan loop; on a detected card, build the canonical UID and POST to the appropriate endpoint.
- Provide physical feedback (LED/buzzer) and handle offline/reconnect.

### RC522 responsibility
- Powered from **3.3V** (never 5V — PRD §27 hardware rule).
- Reads the card UID over SPI on a tap.
- Reports present/absent card state to the ESP8266 loop.

### Wi-Fi connection
- `ESP8266WiFi` with `WiFi.begin(SSID, PASS)` from config.
- On boot, block until connected (with a timeout + reboot/retry safety), then proceed to heartbeat.

### RFID scan loop
```
loop():
  if card present:
     uid = canonicalHex(readUID())
     if mode == ENROLL:  POST /api/device/rfid/register {uid}
     else:               POST /api/device/attendance   {uid, scanned_at}
     feedback(result)
     debounce()                      // prevent immediate duplicate scan
  heartbeatIfDue()
  maintainWifi()
```

### HTTPS communication
- `WiFiClientSecure` + BearSSL; TLS verification on (do not disable cert validation in production).
- JSON body, `Content-Type: application/json`, device-auth headers.
- Timeout per request (e.g., 5–8s); on timeout treat as network failure.

### Heartbeat
- Every **30–60s** POST `/api/device/heartbeat` with `{device_id, firmware_version, uptime, wifi_rssi}`.
- Response includes `server_time` (device may use it to sanity-check its clock, but the **server date** is authoritative for attendance).

### Reconnect logic
- If Wi-Fi drops: blink offline indicator, call `WiFi.reconnect()` with exponential backoff (e.g., 1s, 2s, 4s … capped at 30s).
- If API unreachable: retry with backoff; do **not** crash; keep scanning and keep trying.
- Bounded retries; if persistently failing, stay in a safe low-power scan loop and surface "offline" via LED.

### Physical feedback (PRD §28)
- Success (present): short beep + green LED.
- Unknown card: error beep + red LED.
- Already marked: distinct beep + amber LED.
- Offline: periodic indicator + auto reconnect.
- If no buzzer/LED in the physical MVP, Serial Monitor messages are acceptable during development only.

### Firmware configuration (`config.h`, gitignored)
```
#define DEVICE_ID      "pt_esp_01HxK3mQpL9z"
#define DEVICE_TOKEN   "9f2c..."            // raw token, shown once at creation
#define API_BASE_URL   "https://api.presentap.app"
#define WIFI_SSID      "..."                // provided by admin, not in repo
#define WIFI_PASSWORD  "..."                // provided by admin, not in repo
#define FIRMWARE_VERSION "1.0.0"
#define HEARTBEAT_MS   45000
```
Secrets (`WIFI_PASSWORD`, `DEVICE_TOKEN`) are supplied during local upload and are **gitignored**. They are never in public URLs or committed.

---

## 3.7 Authentication Architecture

### Human authentication — Supabase Auth
- Email/password sign-up, sign-in, sign-out, password reset.
- Session cookie issued by Supabase; Next.js middleware enforces the auth boundary.
- `profiles.organization_id` drives RLS via `current_org_id()`.

### Device authentication — device credential (NOT Supabase)
- The ESP8266 is identified by `device_id` + `device_token` (HMAC-verified hash stored in `devices.device_token_hash`).
- The device is **never** a Supabase Auth user and **never** receives a Supabase key.

### Why the ESP8266 must never contain `SUPABASE_SERVICE_ROLE_KEY`
- The service-role key **bypasses all RLS**. If embedded in firmware it would ship to every physical device, be extractable from flash, and grant an attacker full read/write to every organization's data. A single leaked device = total compromise.
- Instead, the device holds only a scoped token that proves *its own identity*. The Next.js server (which holds the service-role key, server-side only) validates the device, then performs the minimal authorized operation on its behalf. Compromise of one device token = one device, one org, write-only to its own class.
- Firmware rules (`Rules.md` §4.7) and security rules (`Rules.md` §4.6) forbid this explicitly.

---

## 3.8 Attendance Event Lifecycle

Exact sequence enforced by `lib/attendance/service.ts`:

```text
RFID Card
    ↓
RC522 (reads UID)
    ↓
ESP8266 (canonical hex UID)
    ↓
HTTPS Request → POST /api/device/attendance {uid, scanned_at}
    ↓
Device Authentication (HMAC verify device token; derive org + class from device row)
    ↓
Resolve RFID UID → student (uq_students_rfid_active)
    ↓
Find Student (must exist & active)
    ↓
Validate Organization (student.org == device.org)
    ↓
Validate Class (student.class_id == device.class_id)
    ↓
Validate Student Status (active, not archived)
    ↓
Check Duplicate Attendance (UNIQUE student_id,class_id,attendance_date)
    ↓
Create Attendance Record (server date + server timestamp, status=present)
    ↓
Insert device_events (attendance_scan)
    ↓
Realtime Update (Postgres Changes → dashboard)
    ↓
Dashboard (present count +1, new row in feed)
```

Outcomes returned to the device (and reflected on the dashboard):
- `present` — first valid scan.
- `already_present` — duplicate; no row created (unique violation caught).
- `unknown_card` — UID not linked to any active student.
- `wrong_class` — student exists but not in this device's class.
- `archived_student` — student archived.
- `invalid_device` / `disabled_device` — auth failure.

---

## 3.9 Failure Handling

| Failure | Where | Behavior |
|---------|-------|----------|
| Wi-Fi disconnected | ESP8266 | Offline LED; reconnect with backoff; keep scanning. |
| API unavailable | ESP8266 | Retry with backoff; surface "offline"; do not crash. |
| Invalid device credential | API | `401 invalid_device`; device shows error + retries later. |
| Unknown RFID | API | `unknown_card`; red LED; no DB row. |
| Duplicate scan | API/DB | `already_present`; unique constraint blocks 2nd row; amber LED. |
| Wrong class | API | `wrong_class`; red LED; no row. |
| Archived student | API | `archived_student`; no row. |
| Disabled device | API | `disabled_device`; reject all writes. |
| Malformed request | API | `400` + Zod error; no processing. |
| Database failure | API | Graceful `500`; device retries; no partial state. |
| Realtime failure | Dashboard | Optimistic insert already in DB; dashboard falls back to periodic refetch; no data loss. |

---

## 3.10 Security Architecture

- **RLS (org isolation):** every org-owned table filtered by `current_org_id()` (`Backend Schema.md` §8). No cross-org reads/writes possible for human users.
- **Device authentication:** HMAC-verified token; org/class derived server-side (`Backend Schema.md` §9).
- **Secret handling:** service-role key + `DEVICE_AUTH_SECRET` exist only in server env. Device holds only its token. Raw token shown once. Wi-Fi creds gitignored.
- **HTTPS everywhere:** device→API and browser→Supabase both TLS. No plaintext transport.
- **Input validation:** Zod on every route; canonicalize UID; reject malformed payloads before any DB touch.
- **Rate limiting:** per-device fixed-window (heartbeat ≤1/10s, attendance ≤1/2s); simple in-memory for single instance or Upstash for multi-instance. Prevents brute force / accidental floods.
- **Replay considerations:** HTTPS prevents interception; a replayed attendance request is idempotent (unique constraint → `already_present`); replayed heartbeat is harmless. Device token never appears in URLs.
- **Backend trust boundaries:** the API is the only writer for device data. It never trusts `organization_id` from a device; it validates org/class/student consistency before insert. The DB `attendance_org_guard` trigger is a final backstop.
- **Auditability:** every device action logged in `device_events` (heartbeat, attendance_scan, rfid_registration, error) with payload. Supports incident review without exposing secrets.

---

## 3.11 Future Extensibility (post-MVP)

The same architecture absorbs new methods by extending, not rewriting:

- **Face attendance (phone/laptop camera):** a browser capture that, after human auth, calls a new `/api/attendance/face` (or reuses `/attendance` with `source='face'`). No schema change — `attendance.source` already allows extension.
- **Raspberry Pi / ESP32-CAM:** a new `device_type` value; same device-auth + attendance flow, richer payload.
- **Multiple device stations:** already supported — many `devices` per class/org; each independently authenticated.
- **Offline queue / OTA:** additive — `device_events` already logs; an offline buffer on the device can be flushed on reconnect, still idempotent via the unique constraint.

None of these require breaking the MVP schema or API once shipped.

---

## 3.12 Architecture Decisions

| Decision | Selected Approach | Reason | Trade-off |
|----------|-------------------|--------|-----------|
| Web + API | Next.js App Router (UI + Route Handlers) | One deployable; server hosts device gateway | Monolith vs microservice; fine for MVP |
| DB | Supabase PostgreSQL + RLS | Managed Postgres, RLS, Realtime together | Vendor lock-in to Supabase |
| Auth (humans) | Supabase Auth | Email/pw + reset out of the box | — |
| Auth (devices) | HMAC-verified device token | No Supabase key on hardware; scoped identity | Token rotation requires re-flash/config |
| Device→DB path | API gateway + service-role (server) | Backend is trusted bridge; enforces rules | Extra hop vs direct; needed for safety |
| Attendance date | Server UTC date | ESP8266 clock untrusted (PRD §17.3) | No per-org timezone in MVP |
| Duplicate prevention | DB unique `(student,class,date)` | Guaranteed, not just app-level | Requires catching unique-violation |
| Realtime | Supabase Realtime | Live dashboard, no polling | Another Supabase dependency |
| Firmware | Arduino + MFRC522 + BearSSL | Standard NodeMCU stack | C++ complexity vs MicroPython |
| Transport | HTTPS REST JSON | Simple, secure, firewall-friendly | Less efficient than binary (ok for MVP) |
| RFID uniqueness | Partial unique index (active only) | Allows re-use after archive | Must filter on status |
| Enrollment | Short-lived session table | Prevents accidental RFID reassignment | Extra table + TTL management |
| Credential storage | HMAC hash of token | Raw token never persisted | Secret rotation invalidates all tokens |
