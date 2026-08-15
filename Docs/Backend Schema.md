# PresenTap — Backend Schema

**Status:** MVP Database Source of Truth
**Database:** PostgreSQL (via Supabase)
**Supersedes:** Any verbal/in-code schema decisions. This file is authoritative for the database.

> Companion documents: `Architecture.md` (system design), `Rules.md` (engineering rulebook), `Phases.md` (implementation order), `Design.md` (UI). `PRD.md` remains the product source of truth.

---

## 1. Purpose & Scope

This document defines the complete PostgreSQL schema for the PresenTap MVP:

- Every table, column, type, default, constraint, index, and Row-Level Security (RLS) policy.
- The device credential model (how ESP8266 devices are authenticated without the Supabase service-role key).
- The migration order, seed data, and safe example queries.

**In scope (MVP):** organizations, profiles, classes, students, devices, attendance, device_events, rfid_enrollment_sessions.

**Out of scope (post-MVP, NOT implemented here):** face/phone/laptop attendance, Raspberry Pi, ESP32-CAM, QR, fingerprint, GPS, parent/student apps, fees, exams, timetable, payroll, notifications, multi-campus. Future features may be added later behind the same `attendance` table and API.

---

## 2. Canonical Decisions (shared with all docs)

These decisions are binding across every PresenTap document. Do not contradict them.

| ID | Decision | Value |
|----|----------|-------|
| CD-1 | Primary keys | Internal UUIDs via `gen_random_uuid()` for all tables except `devices`. |
| CD-2 | `devices.id` | Public string `pt_esp_` + 12 base62 chars (e.g. `pt_esp_01HxK3mQpL9z`). Globally unique by construction. TEXT PK. |
| CD-3 | Device token | 32 random bytes → 64-char hex. Stored only as `device_token_hash = HMAC_SHA256(DEVICE_AUTH_SECRET, token)`. Raw token shown once at creation, never persisted. |
| CD-4 | RFID UID canonical form | Uppercase hexadecimal of the raw byte array, no separators (e.g. `A3B71C92`, or `A3B71C92D4F5E607` for 7-byte UIDs). TEXT. |
| CD-5 | Attendance date | Server-defined UTC date. `attendance_date DATE` derived as `(now() AT TIME ZONE 'UTC')::date`. ESP8266 clock is never trusted for the official date. |
| CD-6 | Attendance timestamp | `marked_at timestamptz DEFAULT now()` (server-authoritative). Device `scanned_at` is stored only as metadata in `device_events.payload`. |
| CD-7 | Duplicate attendance | Enforced by `UNIQUE (student_id, class_id, attendance_date)`. No second row is ever created. |
| CD-8 | Attendance `status` | `present` (auto-inserted in MVP). `absent` and `late` are in the enum but NOT inserted in MVP; absence is derived. |
| CD-9 | Attendance `source` | `device` (ESP8266). Only `device` is produced in MVP. |
| CD-10 | Device online/offline | Derived, not stored: online if `last_seen_at > now() - INTERVAL '90 seconds'` (1.5× the 60s heartbeat). |
| CD-11 | Enrollment session | Short-lived `rfid_enrollment_sessions` row (TTL 5 min) ties a scan to a specific student + device so arbitrary scans cannot reassign RFIDs. |
| CD-12 | Status enums | See §4. Enforced with Postgres `CHECK` constraints (not native enums, for easy future extension). |
| CD-13 | RLS trust boundary | Human requests use the publishable (anon) Supabase client with RLS. Device requests use the **server** service-role client *after* device-credential verification; the API explicitly sets/validates `organization_id` from the device row. |
| CD-14 | Timestamps | All `created_at`/`updated_at` are `timestamptz` with `now()` defaults; `updated_at` maintained by a shared trigger. |

---

## 3. ER Diagram

```text
Organization (organizations)
├── Profiles (profiles)                 — 1 org : many users
├── Classes (classes)                   — 1 org : many classes
│   └── Students (students)             — 1 class : many students
├── Devices (devices)                   — 1 org : many devices (assigned to 1 class)
└── Attendance (attendance)             — many rows, each: org + student + class + device
        │
        ├── FK attendance.student_id  → students.id
        ├── FK attendance.class_id    → classes.id
        ├── FK attendance.device_id   → devices.id
        └── FK attendance.org_id      → organizations.id

Student ─────────── Attendance (student_id)
Class   ─────────── Attendance (class_id)
Device  ─────────── Attendance (device_id)

device_events
└── FK device_events.device_id → devices.id   (org reached via devices)

rfid_enrollment_sessions
├── FK organization_id → organizations.id
├── FK student_id      → students.id
└── FK device_id       → devices.id
```

---

## 4. Status / Type Enums (CHECK-constrained TEXT)

Stored as `TEXT` with `CHECK` constraints so values can be extended later without migration pain.

| Column | Table | Allowed values | MVP behavior |
|--------|-------|----------------|--------------|
| `type` | organizations | `school`, `college` | both selectable |
| `role` | profiles | `admin`, `teacher` | `admin` required; `teacher` optional read-only |
| `status` | classes | `active`, `archived` | archived hides from active lists, keeps history |
| `status` | students | `active`, `archived` | archived → no new attendance, no duplicate RFID |
| `status` | devices | `active`, `disabled` | `disabled` → cannot submit attendance/heartbeat |
| `status` | attendance | `present`, `absent`, `late` | only `present` inserted in MVP |
| `source` | attendance | `device` | only `device` in MVP |
| `event_type` | device_events | `heartbeat`, `attendance_scan`, `rfid_registration`, `error` | all four used |
| `status` | rfid_enrollment_sessions | `pending`, `completed`, `expired`, `cancelled` | lifecycle managed by API |

---

## 5. Table Specifications

Legend: **PK** = primary key, **FK** = foreign key, **U** = unique, **N** = nullable.

### 5.1 `organizations`

Institution account. Every owned record references this via `organization_id`.

| Column | Type | Null | Default | Description | Key |
|--------|------|------|---------|-------------|-----|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key | PK |
| `name` | `text` | NO | — | Institution name (e.g. "Greenfield Public School") | |
| `type` | `text` | NO | `'school'` | `school` or `college` (CD-4 / §4) | CHECK |
| `logo_url` | `text` | YES | `NULL` | Optional logo (public URL) | |
| `created_at` | `timestamptz` | NO | `now()` | | |
| `updated_at` | `timestamptz` | NO | `now()` | maintained by trigger | |

Constraints: `CHECK (type IN ('school','college'))`, `CHECK (char_length(name) BETWEEN 1 AND 120)`.

### 5.2 `profiles`

One row per Supabase Auth user. Links the auth identity to an organization and role.

| Column | Type | Null | Default | Description | Key |
|--------|------|------|---------|-------------|-----|
| `id` | `uuid` | NO | — | = `auth.users.id` | PK, FK→`auth.users(id)` ON DELETE CASCADE |
| `organization_id` | `uuid` | YES | `NULL` | Org the user belongs to; `NULL` only before onboarding completes | FK→`organizations(id)` |
| `full_name` | `text` | NO | — | Admin/teacher display name | |
| `role` | `text` | NO | `'admin'` | `admin` or `teacher` | CHECK |
| `created_at` | `timestamptz` | NO | `now()` | | |
| `updated_at` | `timestamptz` | NO | `now()` | | |

Constraints: `CHECK (role IN ('admin','teacher'))`, `CHECK (char_length(full_name) BETWEEN 1 AND 120)`.
Notes: `organization_id` is nullable only during the brief pre-onboarding window; onboarding (`/setup/organization`) sets it. After that it must be non-null for dashboard access.

### 5.3 `classes`

| Column | Type | Null | Default | Description | Key |
|--------|------|------|---------|-------------|-----|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key | PK |
| `organization_id` | `uuid` | NO | — | Owning org | FK→`organizations(id)` |
| `name` | `text` | NO | — | Class name (e.g. "11") | |
| `section` | `text` | YES | `NULL` | Section (e.g. "A"); display "11-A" | |
| `academic_year` | `text` | YES | `NULL` | e.g. "2026-27" | |
| `room` | `text` | YES | `NULL` | e.g. "Lab 2" | |
| `status` | `text` | NO | `'active'` | `active` / `archived` | CHECK |
| `created_at` | `timestamptz` | NO | `now()` | | |
| `updated_at` | `timestamptz` | NO | `now()` | | |

Constraints: `CHECK (status IN ('active','archived'))`, `CHECK (char_length(name) BETWEEN 1 AND 60)`.
Display name helper (app-level): `name || '-' || section` when section present.

### 5.4 `students`

| Column | Type | Null | Default | Description | Key |
|--------|------|------|---------|-------------|-----|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key | PK |
| `organization_id` | `uuid` | NO | — | Owning org | FK→`organizations(id)` |
| `class_id` | `uuid` | NO | — | Enrolled class | FK→`classes(id)` |
| `full_name` | `text` | NO | — | Student full name | |
| `roll_number` | `text` | YES | `NULL` | Roll number (unique per class) | partial U (§6) |
| `student_identifier` | `text` | YES | `NULL` | Admission/registration number | |
| `rfid_uid` | `text` | YES | `NULL` | Canonical RFID UID (unique among active) | partial U (§6) |
| `status` | `text` | NO | `'active'` | `active` / `archived` | CHECK |
| `created_at` | `timestamptz` | NO | `now()` | | |
| `updated_at` | `timestamptz` | NO | `now()` | | |

Constraints: `CHECK (status IN ('active','archived'))`, `CHECK (char_length(full_name) BETWEEN 1 AND 120)`.
Notes: `rfid_uid` stored canonical (CD-4). A `NULL` rfid_uid = not yet registered.

### 5.5 `devices`

ESP8266 + RC522 attendance station.

| Column | Type | Null | Default | Description | Key |
|--------|------|------|---------|-------------|-----|
| `id` | `text` | NO | — | Public device id `pt_esp_…` | PK |
| `organization_id` | `uuid` | NO | — | Owning org | FK→`organizations(id)` |
| `class_id` | `uuid` | NO | — | Class this device takes attendance for | FK→`classes(id)` |
| `name` | `text` | NO | — | Human name (e.g. "ESP-11A-01") | |
| `device_type` | `text` | NO | `'ESP8266_RC522'` | Hardware type | CHECK |
| `device_token_hash` | `text` | NO | — | `HMAC_SHA256(DEVICE_AUTH_SECRET, raw_token)` | |
| `status` | `text` | NO | `'active'` | `active` / `disabled` | CHECK |
| `firmware_version` | `text` | YES | `NULL` | e.g. "1.0.0" | |
| `last_seen_at` | `timestamptz` | YES | `NULL` | Last successful request (heartbeat/scan) | |
| `created_at` | `timestamptz` | NO | `now()` | | |
| `updated_at` | `timestamptz` | NO | `now()` | | |

Constraints: `CHECK (status IN ('active','disabled'))`, `CHECK (device_type IN ('ESP8266_RC522'))`, `CHECK (char_length(name) BETWEEN 1 AND 60)`, `CHECK (char_length(id) = 19 AND id LIKE 'pt_esp_%')`.
-- Rationale: prefix "pt_esp_" is 7 chars; the suffix is 12 base62 chars → 19 total (e.g. pt_esp_01HxK3mQpL9z).
Notes: Raw token is **never** stored. Online/offline is derived from `last_seen_at` (CD-10).

### 5.6 `attendance`

One row per valid present scan. Duplicate scans are blocked at the DB (CD-7).

| Column | Type | Null | Default | Description | Key |
|--------|------|------|---------|-------------|-----|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key | PK |
| `organization_id` | `uuid` | NO | — | Owning org (denormalized for RLS + reporting) | FK→`organizations(id)` |
| `student_id` | `uuid` | NO | — | Student marked present | FK→`students(id)` |
| `class_id` | `uuid` | NO | — | Class context of the scan | FK→`classes(id)` |
| `device_id` | `text` | NO | — | Device that submitted the scan | FK→`devices(id)` |
| `attendance_date` | `date` | NO | `(now() AT TIME ZONE 'UTC')::date` | Server-defined date (CD-5) | part of U |
| `marked_at` | `timestamptz` | NO | `now()` | Server-authoritative timestamp (CD-6) | |
| `status` | `text` | NO | `'present'` | `present` (MVP) | CHECK |
| `source` | `text` | NO | `'device'` | `device` (MVP) | CHECK |
| `created_at` | `timestamptz` | NO | `now()` | | |

Constraints:
- `UNIQUE (student_id, class_id, attendance_date)` — **the core duplicate-prevention constraint (CD-7).**
- `CHECK (status IN ('present','absent','late'))`
- `CHECK (source IN ('device'))` — extend later for `manual` etc.
Notes: `organization_id` is denormalized (also reachable via student/class/device) to make RLS and reporting queries simple and fast. It is always set equal to the device's org.

### 5.7 `device_events`

Audit/telemetry log for the device. Supports heartbeat history, scan history, enrollment events, and errors.

| Column | Type | Null | Default | Description | Key |
|--------|------|------|---------|-------------|-----|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key | PK |
| `device_id` | `text` | NO | — | Device that emitted the event | FK→`devices(id)` |
| `event_type` | `text` | NO | — | `heartbeat` / `attendance_scan` / `rfid_registration` / `error` | CHECK |
| `payload` | `jsonb` | YES | `NULL` | Event-specific data (e.g. rssi, uptime, uid, scanned_at) | |
| `created_at` | `timestamptz` |NO | `now()` | | |

Constraints: `CHECK (event_type IN ('heartbeat','attendance_scan','rfid_registration','error'))`.
Notes: `organization_id` is intentionally **not** stored here; reach it via `devices.organization_id` for RLS. This keeps the hot-path insert lean.

### 5.8 `rfid_enrollment_sessions`

Ties an in-progress RFID registration to a specific student + device so a scan can only enroll the intended student (PRD §12, §30).

| Column | Type | Null | Default | Description | Key |
|--------|------|------|---------|-------------|-----|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key | PK |
| `organization_id` | `uuid` | NO | — | Owning org | FK→`organizations(id)` |
| `student_id` | `uuid` | NO | — | Student to receive the UID | FK→`students(id)` |
| `device_id` | `text` | NO | — | Device expected to perform the scan | FK→`devices(id)` |
| `status` | `text` | NO | `'pending'` | `pending`/`completed`/`expired`/`cancelled` | CHECK |
| `expires_at` | `timestamptz` | NO | `now() + INTERVAL '5 minutes'` | Auto-expire window | |
| `created_at` | `timestamptz` | NO | `now()` | | |
| `updated_at` | `timestamptz` | NO | `now()` | | |

Constraints: `CHECK (status IN ('pending','completed','expired','cancelled'))`.
Notes: Only one `pending` session per `(student_id, device_id)` should be active; the API enforces this (and expires stale ones). The device simply sends a scan while a pending session exists.

---

## 6. Constraints (authoritative)

### 6.1 RFID UID uniqueness (active students, per org)
A UID cannot belong to two **active** students in the same org (PRD §12, §19-1).

```sql
CREATE UNIQUE INDEX uq_students_rfid_active
  ON students (organization_id, rfid_uid)
  WHERE status = 'active' AND rfid_uid IS NOT NULL;
```

### 6.2 Roll number uniqueness (per class)
Roll number unique within a class (PRD §19-2). Using a partial index keeps archived/empty rows from colliding.

```sql
CREATE UNIQUE INDEX uq_students_roll_active
  ON students (class_id, roll_number)
  WHERE status = 'active' AND roll_number IS NOT NULL;
```

### 6.3 Device ID global uniqueness
`devices.id` is the PK and carries the `pt_esp_` format; globally unique by construction (CD-2).

### 6.4 Attendance duplicate prevention
Single most important constraint (PRD §17, §19-4, CD-7):

```sql
ALTER TABLE attendance
  ADD CONSTRAINT uq_attendance_daily
  UNIQUE (student_id, class_id, attendance_date);
```
This makes a second `present` insert on the same day a **unique-violation error**, which the API translates to `status: 'already_present'` (no second row).

### 6.5 Valid foreign keys
All FKs above are enforced by the database (`ON DELETE RESTRICT` for class/student/device references where deletion must be blocked; `ON DELETE CASCADE` only for `profiles.id → auth.users`).

### 6.6 Organization consistency
`attendance.organization_id` is set by the API equal to `device.organization_id` and must equal `student.organization_id` and `class.organization_id`. The API validates this before insert (see `Architecture.md` §3.8). A DB-level trigger can optionally re-assert it:

```sql
-- optional guard: attendance org must match student org
CREATE OR REPLACE FUNCTION attendance_org_guard() RETURNS trigger AS $$
BEGIN
  IF NEW.organization_id <> (SELECT organization_id FROM students WHERE id = NEW.student_id) THEN
    RAISE EXCEPTION 'organization mismatch';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
```

### 6.7 Disabled / archived behavior
- `disabled` device → API rejects all `/api/device/*` writes (returns `disabled_device`). No DB row is created.
- `archived` student → API rejects attendance (returns `archived_student`). No DB row is created.
- `archived` class → API rejects attendance for that class.

> Duplicate prevention, archived/disabled rejection, and org consistency are enforced **at the API layer and at the DB layer** (defense in depth). The DB constraint (§6.4) is the final guarantee.

---

## 7. Index Strategy

Every index exists for a concrete query (CD-aligned). Avoid speculative indexes.

| Index | Table | Columns | Reason |
|-------|-------|---------|--------|
| `uq_students_rfid_active` | students | (organization_id, rfid_uid) WHERE active | Resolve UID→student on every scan; enforce duplicate UID. **Hot path.** |
| `uq_students_roll_active` | students | (class_id, roll_number) WHERE active | Enforce unique roll per class. |
| `idx_students_org` | students | (organization_id) | Org-scoped student lists/filters. |
| `idx_students_class` | students | (class_id) | Class roster, student count. |
| `idx_classes_org` | classes | (organization_id) | Org class list; archive filtering. |
| `idx_devices_org` | devices | (organization_id) | Org device list. |
| `idx_devices_class` | devices | (class_id) | "Devices for this class". |
| `idx_attendance_org_date` | attendance | (organization_id, attendance_date) | Dashboard counts, daily reports. **Hot reporting path.** |
| `idx_attendance_class_date` | attendance | (class_id, attendance_date) | Class attendance %, class report. |
| `idx_attendance_student` | attendance | (student_id) | Student history. |
| `idx_attendance_date` | attendance | (attendance_date) | Date-range reports. |
| `idx_device_events_device_created` | device_events | (device_id, created_at DESC) | Device health / recent events. |
| `idx_enroll_pending` | rfid_enrollment_sessions | (device_id, status, expires_at) | Fast lookup of the active session for a device. |
| `idx_profiles_org` | profiles | (organization_id) | Org member listing. |

Notes:
- The unique constraint `uq_attendance_daily` also serves as the lookup index for "did this student already scan today?".
- `device_events` is append-heavy; do not over-index. One composite on `(device_id, created_at)` covers health queries.
- Consider a periodic partition/retention policy for `device_events` post-MVP (not required for MVP).

---

## 8. Row-Level Security (RLS)

### 8.1 Model

- **Human (admin/teacher) requests:** made from the browser using the **publishable (anon) Supabase client**. RLS filters every row by the caller's organization.
- **Device requests:** made to the Next.js API, which verifies the device credential, then writes using the **server service-role client** (bypasses RLS). The API derives `organization_id` from the device row and never trusts any org id sent by the device.
- **No anonymous insert** of attendance/students/etc. is ever permitted. Anon role has no policies granting write.

### 8.2 Helper function

```sql
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;
```

### 8.3 Enable RLS

```sql
ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE students          ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfid_enrollment_sessions ENABLE ROW LEVEL SECURITY;
```

### 8.4 Policies (org-isolated, read/write for the caller's org)

Pattern for every org-owned table `T` with column `organization_id`:

```sql
-- SELECT
CREATE POLICY "T_org_select" ON T
  FOR SELECT USING (organization_id = public.current_org_id());

-- INSERT / UPDATE / DELETE (write only within own org)
CREATE POLICY "T_org_write" ON T
  FOR ALL
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());
```

Apply to: `organizations`, `classes`, `students`, `devices`, `attendance`, `rfid_enrollment_sessions`.

#### `profiles` (special: own row + same-org)
```sql
CREATE POLICY "profiles_self_or_org" ON profiles
  FOR ALL
  USING (id = auth.uid() OR organization_id = public.current_org_id())
  WITH CHECK (id = auth.uid() OR organization_id = public.current_org_id());
```
(Admins may view org members; a user may always read/update their own profile.)

#### `device_events` (org reached via devices)
```sql
CREATE POLICY "device_events_org" ON device_events
  FOR SELECT USING (
    device_id IN (SELECT id FROM devices WHERE organization_id = public.current_org_id())
  );
-- No anon INSERT/UPDATE/DELETE on device_events (device writes go through the API/service-role).
```

### 8.5 Teacher (read-only) scoping — optional MVP

If teacher accounts are enabled (PRD §4.2), restrict them to read:

```sql
-- Example: teachers read only
CREATE POLICY "classes_teacher_read" ON classes
  FOR SELECT USING (
    organization_id = public.current_org_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
  );
```
Implement teacher write-blocking only if teacher accounts ship in MVP; otherwise defer (P1/P2).

### 8.6 What device endpoints must NOT do

- Never use the anon client to insert attendance on behalf of a device.
- Never accept `organization_id` from a device request body; always derive from the authenticated device.
- Never grant the anon role INSERT on `attendance`, `students`, `devices`, `device_events`.

---

## 9. Device Credential Model

The ESP8266 authenticates to the API **without** any Supabase key (PRD §20.3, §31).

### 9.1 Generation (at device creation, server-side)
1. `device.id` = `'pt_esp_' + nanoid(12)` (base62). Example: `pt_esp_01HxK3mQpL9z`.
2. `raw_token` = 32 cryptographically-random bytes → 64-char hex (e.g. `9f2c...`).
3. `device_token_hash` = `HMAC_SHA256(DEVICE_AUTH_SECRET, raw_token)` → stored in `devices.device_token_hash`.
4. `raw_token` is returned to the admin **exactly once** (shown masked / downloadable). It is **never** written to the DB, logs, or Git.

### 9.2 Storage on device
The firmware stores `device.id` + `raw_token` in a **gitignored** `config.h` (or provisioning JSON) flashed locally via Arduino IDE (PRD §14). It is a secret, but it is the only secret the device needs and never grants DB access.

### 9.3 Verification (every device request)
1. Device sends headers `X-Device-Id: <id>` and `X-Device-Token: <raw_token>` over HTTPS.
2. API looks up `devices` by `id` (service-role client).
3. Recomputes `HMAC_SHA256(DEVICE_AUTH_SECRET, received_token)` and compares to `device_token_hash` with a **constant-time** compare.
4. If match **and** `status = 'active'` → request is authenticated; `organization_id` and `class_id` come from the device row.
5. Any mismatch → `401 invalid_device`. Disabled device → `disabled_device`.

### 9.4 Rotation
Regenerate `raw_token` → recompute `device_token_hash`; old token invalid immediately. New token shown once.

### 9.5 Revocation
Set `devices.status = 'disabled'` (rejects all requests) or delete the row. No token purging needed; the hash becomes unusable.

### 9.6 Why this is safe
- The device holds only a token that proves identity; it cannot read other orgs, other tables, or bypass RLS.
- The service-role key is used **only inside the Next.js server** and is never on the device or in the browser.
- `HMAC` binds tokens to the deployment secret (`DEVICE_AUTH_SECRET`); rotating the secret invalidates all tokens (documented operational caveat).

---

## 10. Migration Order

Apply in this exact sequence (each as a separate, reversible migration file under `supabase/migrations/`):

1. `0001_extensions.sql` — enable `pgcrypto` (for `gen_random_uuid()`).
2. `0002_organizations.sql` — `organizations` table.
3. `0003_profiles.sql` — `profiles` table + FK to `auth.users`.
4. `0004_classes.sql` — `classes` table.
5. `0005_students.sql` — `students` table + partial unique indexes (§6.1, §6.2).
6. `0006_devices.sql` — `devices` table.
7. `0007_attendance.sql` — `attendance` table + `uq_attendance_daily` (§6.4) + org guard trigger (§6.6).
8. `0008_device_events.sql` — `device_events` table.
9. `0009_rfid_enrollment_sessions.sql` — enrollment session table + index.
10. `0010_triggers.sql` — `set_updated_at()` trigger applied to all tables with `updated_at`.
11. `0011_indexes.sql` — remaining secondary indexes (§7).
12. `0012_rls.sql` — `current_org_id()`, enable RLS, all policies (§8).
13. `0013_seed.sql` — demo seed (§12). Optional; keep separate from migrations for production.

> Never edit a shipped migration. Add a new migration for schema changes.

---

## 11. Seed Data (demo / hackathon)

Fictional, non-real data. Used for the demo flow (PRD §40) and local dev.

```text
Organization:
  id:        (uuid)
  name:      Greenfield Public School
  type:      school

Class:
  id:        (uuid)
  org:       Greenfield Public School
  name:      11
  section:   A
  academic_year: 2026-27
  room:      Lab 2
  status:    active
  (display: 11-A)

Students (org: Greenfield, class: 11-A, status: active):
  Rishab Gautam   roll 11   rfid_uid A3B71C92
  Aman Verma      roll 12   rfid_uid C4D82E11
  Priya Nair      roll 13   rfid_uid 7F19A6B3
  (1 extra: Dev Sharma roll 14, no RFID yet)

Device:
  id:        pt_esp_DEMO00000123
  org:       Greenfield Public School
  class:     11-A
  name:      ESP-11A-01
  type:      ESP8266_RC522
  status:    active
  firmware:  1.0.0
  (device_token_hash: seeded hash of a known demo token; raw token shown in dev only)

Sample attendance (today, present):
  Rishab Gautam / 11-A / ESP-11A-01 / present / marked_at now()
```

Seed scripts must respect all constraints (unique RFID, unique roll, unique daily attendance).

---

## 12. Example Queries (safe, org-scoped)

All examples assume `@org_id` is the caller's organization. In the app these run via the anon client (RLS enforces org) or via the API with the resolved org.

### 12.1 Today's attendance (present list)
```sql
SELECT s.full_name, s.roll_number, c.name, c.section, a.marked_at, d.name AS device
FROM attendance a
JOIN students s  ON s.id = a.student_id
JOIN classes  c  ON c.id = a.class_id
JOIN devices  d  ON d.id = a.device_id
WHERE a.organization_id = @org_id
  AND a.attendance_date = (now() AT TIME ZONE 'UTC')::date
ORDER BY a.marked_at DESC;
```

### 12.2 Present / absent counts for today
```sql
WITH today AS (
  SELECT (now() AT TIME ZONE 'UTC')::date AS d
)
SELECT
  COUNT(*) FILTER (WHERE a.id IS NOT NULL)                    AS present_count,
  COUNT(s.id)                                                 AS total_students,
  COUNT(s.id) - COUNT(a.id)                                   AS absent_count,
  ROUND(100.0 * COUNT(a.id) / NULLIF(COUNT(s.id),0), 1)       AS attendance_pct
FROM students s
LEFT JOIN attendance a
       ON a.student_id = s.id
      AND a.class_id   = s.class_id
      AND a.attendance_date = (SELECT d FROM today)
WHERE s.organization_id = @org_id
  AND s.status = 'active';
```
(Absent = active students with no present row for the date.)

### 12.3 Student attendance history
```sql
SELECT a.attendance_date, a.marked_at, a.status, c.name, c.section, d.name AS device
FROM attendance a
JOIN classes c ON c.id = a.class_id
JOIN devices d ON d.id = a.device_id
WHERE a.student_id = @student_id
  AND a.organization_id = @org_id
ORDER BY a.attendance_date DESC;
```

### 12.4 Class attendance percentage (date range)
```sql
SELECT c.id, c.name, c.section,
       COUNT(DISTINCT s.id)                                   AS total_students,
       COUNT(DISTINCT a.student_id)                           AS present_students,
       ROUND(100.0 * COUNT(DISTINCT a.student_id)
             / NULLIF(COUNT(DISTINCT s.id),0), 1)             AS pct
FROM classes c
JOIN students s ON s.class_id = c.id AND s.status = 'active'
LEFT JOIN attendance a
       ON a.class_id = c.id
      AND a.attendance_date BETWEEN @start AND @end
WHERE c.organization_id = @org_id
GROUP BY c.id, c.name, c.section
ORDER BY c.name;
```

### 12.5 Recent attendance events (dashboard feed)
```sql
SELECT a.id, s.full_name, s.roll_number, c.name, c.section,
       a.marked_at, a.status, d.name AS device
FROM attendance a
JOIN students s ON s.id = a.student_id
JOIN classes  c ON c.id = a.class_id
JOIN devices  d ON d.id = a.device_id
WHERE a.organization_id = @org_id
ORDER BY a.marked_at DESC
LIMIT 25;
```

### 12.6 Device health
```sql
SELECT d.id, d.name, d.status, d.firmware_version, d.last_seen_at,
       CASE WHEN d.last_seen_at > now() - INTERVAL '90 seconds'
            THEN 'online' ELSE 'offline' END AS online_state,
       EXTRACT(EPOCH FROM (now() - d.last_seen_at))::int AS secs_since_seen
FROM devices d
WHERE d.organization_id = @org_id
ORDER BY d.name;
```

### 12.7 Active enrollment session for a device
```sql
SELECT id, student_id, device_id, status, expires_at
FROM rfid_enrollment_sessions
WHERE device_id = @device_id
  AND status = 'pending'
  AND expires_at > now()
ORDER BY created_at DESC
LIMIT 1;
```

---

## 13. Consistency Checklist (used by the cross-doc audit)

- [x] Every PRD-required entity exists: organizations, profiles, classes, students, devices, attendance, device_events (+rfid_enrollment_sessions required by §12/§30).
- [x] Every API operation in `Architecture.md` §3.5 / §3.8 is supported by these tables.
- [x] Duplicate attendance is DB-enforced (§6.4).
- [x] RFID uniqueness is DB-enforced (§6.1).
- [x] Roll uniqueness is DB-enforced (§6.2).
- [x] Disabled/archived rejection is enforceable (API + status columns).
- [x] Device credential model stores only a hash (§9).
- [x] No service-role key is needed on the device (§9.3).
- [x] RLS isolates organizations (§8).
- [x] Future attendance methods (face/phone/RPi) can be added without schema break (extend `source`/`device_type` only).
