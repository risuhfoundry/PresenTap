# PresenTap — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** MVP Build Specification  
**Product:** PresenTap  
**MVP Focus:** RFID-based attendance using ESP8266 + RC522  
**Primary Users:** Schools and colleges  
**Document Purpose:** Single source of truth for implementing the first working MVP

---

# 1. Product Overview

## 1.1 Product Name

**PresenTap**

## 1.2 Tagline

**Tap. Record. Done.**

## 1.3 One-line Product Description

PresenTap is a web-based attendance platform that allows schools and colleges to create and operate their own RFID attendance system using affordable ESP8266 + RC522 hardware.

## 1.4 Product Vision

PresenTap aims to become a hardware-agnostic attendance platform where an institution can choose an attendance method and device, configure it from the web, deploy the required software, and manage attendance from one centralized system.

The first MVP intentionally supports only:

> **ESP8266 + RC522 + RFID cards**

Future attendance methods such as face recognition using phones/laptops can be added after the RFID MVP is stable.

---

# 2. Problem Statement

Traditional attendance systems can require:

- expensive proprietary hardware,
- complicated installation,
- manual attendance entry,
- disconnected hardware and software,
- technical knowledge for configuration,
- difficult attendance reporting.

Schools and colleges should be able to deploy a low-cost attendance device without having to build or maintain the complete software stack themselves.

PresenTap solves this by connecting:

**RFID hardware → cloud API → attendance database → live dashboard**

---

# 3. MVP Objective

Build a fully working end-to-end system where a school/college administrator can:

1. Create an institution account.
2. Create classes.
3. Add students.
4. Register an RFID card to each student.
5. Create/register an ESP8266 attendance device.
6. Assign the device to a class.
7. Configure Wi-Fi and device credentials.
8. Deploy firmware to the ESP8266.
9. Connect RC522 to the ESP8266.
10. Scan a student's RFID card.
11. Send the scan securely to the PresenTap backend.
12. Identify the student.
13. Validate the attendance event.
14. Record attendance.
15. Update the dashboard in near real time.
16. View and export attendance records.

## MVP Success Definition

The MVP is successful only when the following physical demo works:

> Student taps RFID card → RC522 reads UID → ESP8266 sends event → backend identifies student → attendance is stored → dashboard updates.

---

# 4. Target Users

## 4.1 Institution Administrator

Primary MVP user.

Needs to:

- set up institution,
- create classes,
- add students,
- register RFID cards,
- configure devices,
- monitor attendance,
- view reports,
- export data.

## 4.2 Teacher

Optional read-only user for MVP.

Can:

- view assigned classes,
- view today's attendance,
- inspect student attendance history.

Teacher account creation can be deferred if needed.

## 4.3 Student

Students do not need an account in the MVP.

They interact only through:

> **RFID card/tag → RC522 reader**

---

# 5. MVP Scope

## 5.1 In Scope

### Authentication
- Sign up
- Sign in
- Sign out
- Password reset
- Supabase Auth

### Organization
- Institution name
- Institution type: School / College
- Basic institution profile

### Classes
- Create class
- Edit class
- Archive class
- Search/view classes
- Student count per class

### Students
- Add student
- Edit student
- Archive student
- Search student
- Filter by class
- Roll number
- Student ID/admission number
- RFID UID association

### RFID Enrollment
- Select student
- Start RFID registration
- Scan card through an ESP8266 device
- Receive UID
- Detect duplicate UID
- Associate UID with student
- Confirm successful enrollment

### Device Management
- Register ESP8266 device
- Device name
- Device ID
- Device secret
- Class assignment
- Device status
- Last seen
- Firmware version
- Enable/disable device

### Attendance
- RFID scan event
- Student identification
- Class validation
- Duplicate attendance prevention
- Timestamp
- Present status
- Attendance history
- Recent attendance events

### Dashboard
- Today's present count
- Today's absent count
- Attendance percentage
- Class summary
- Recent scans
- Device status

### Reports
- Daily attendance
- Date-range attendance
- Student attendance history
- Class attendance
- CSV export

### Hardware
- ESP8266 NodeMCU
- RC522 RFID reader
- RFID cards/tags
- Wi-Fi connectivity

### Backend
- REST API
- Device authentication
- Attendance event API
- Device heartbeat API
- RFID enrollment API

### Security
- Row Level Security
- Organization-level data isolation
- Device-specific credentials
- No Supabase service-role key in ESP8266 firmware

---

# 6. Explicitly Out of Scope

The following are NOT part of the first MVP:

- Face recognition
- Phone attendance
- Laptop camera attendance
- Raspberry Pi support
- ESP32-CAM
- QR attendance
- Fingerprint attendance
- GPS attendance
- Parent app
- Student app
- Fees
- Exams
- Timetable
- Payroll
- SMS/WhatsApp notifications
- Advanced AI assistant
- Automatic hardware marketplace
- Full browser-based firmware flashing for every device/browser
- Complex multi-level permissions
- Biometric data storage
- Multi-campus enterprise features

These belong to the future roadmap.

---

# 7. Core User Experience

## 7.1 First-Time Setup

```text
Landing Page
    ↓
Sign Up
    ↓
Create Institution
    ↓
Create Class
    ↓
Add Students
    ↓
Register ESP8266 Device
    ↓
Assign Device to Class
    ↓
Configure Device
    ↓
Connect ESP8266 + RC522
    ↓
Register RFID Cards
    ↓
Start Attendance
```

---

# 8. Main Product Modules

## 8.1 Authentication Module

### Requirements

Admin must be able to:

- sign up using email/password,
- log in,
- log out,
- reset password.

### Acceptance Criteria

- Unauthenticated users cannot access the dashboard.
- Authenticated users can only see their organization's data.
- Session persists across page reloads.
- Logout invalidates the local session.

---

# 9. Organization Module

## Data

- organization ID
- organization name
- institution type
- logo URL (optional)
- created_at
- updated_at

### Requirements

Admin can:

- create organization during onboarding,
- edit organization profile,
- view organization details.

---

# 10. Class Module

## Class Fields

- id
- organization_id
- name
- section
- academic_year
- room
- status
- created_at
- updated_at

### Example

```text
Class: 11
Section: A
Academic Year: 2026-27
Room: Lab 2

Display: 11-A
```

### Requirements

Admin can:

- create class,
- edit class,
- archive class,
- view class,
- see total students.

---

# 11. Student Module

## Student Fields

- id
- organization_id
- class_id
- full_name
- roll_number
- student_identifier
- rfid_uid
- status
- created_at
- updated_at

### Student Status

- active
- archived

### Requirements

Admin can:

- manually add a student,
- edit student details,
- archive a student,
- search students,
- filter by class,
- view RFID registration status.

### Future Enhancement

CSV student import may be added after the core MVP is working.

---

# 12. RFID Registration

This is a critical feature.

## User Flow

```text
Student Profile
    ↓
Register RFID
    ↓
Select Connected Device
    ↓
Start Scan Mode
    ↓
Tap RFID Card
    ↓
ESP8266 Reads UID
    ↓
Backend Receives UID
    ↓
Validate Device
    ↓
Check Duplicate UID
    ↓
Assign UID
    ↓
Show Success
```

## UI

```text
Register RFID Card

Student:
Rishab Gautam

Class:
11-A

Device:
ESP-11A-01

Status:
Waiting for card...

[ Cancel ]
```

After scan:

```text
✓ RFID Registered

UID:
A3B71C92

Student:
Rishab Gautam

Class:
11-A
```

## Duplicate UID Rule

An RFID UID cannot belong to two active students within the same organization.

If a duplicate is detected:

```text
This card is already assigned to another student.
```

The original assignment must remain unchanged.

---

# 13. Device Module

## 13.1 Hardware

MVP device:

> ESP8266 NodeMCU + RC522

## 13.2 Device Fields

- id
- organization_id
- class_id
- name
- device_type
- device_token_hash
- status
- firmware_version
- last_seen_at
- created_at
- updated_at

## 13.3 Device Creation

Admin chooses:

```text
Device Name:
[ ESP-11A-01 ]

Class:
[ 11-A ]

Hardware:
[ ESP8266 + RC522 ]

[ Create Device ]
```

After creation:

```text
Device Created

Device ID:
pt_esp_01H...

Device Token:
**************

[ Download Configuration ]
[ View Setup Instructions ]
```

The raw device token must be shown only when appropriate and should not be stored in plaintext.

---

# 14. Device Provisioning

## MVP Approach

Do not attempt universal browser firmware flashing.

For the MVP, provide a controlled provisioning flow:

1. Admin creates device.
2. System generates device ID and credential.
3. PresenTap provides firmware/configuration values.
4. Developer/admin uploads firmware to ESP8266 using Arduino IDE or a supported local uploader.
5. Device connects to Wi-Fi.
6. Device sends heartbeat.
7. Dashboard shows device online.

## Firmware Configuration

Firmware needs:

- device ID
- device credential/token
- API base URL
- Wi-Fi SSID
- Wi-Fi password
- firmware version

Sensitive values must never be displayed in public URLs or committed to source control.

---

# 15. ESP8266 Firmware Requirements

## 15.1 Startup

On boot:

1. Initialize serial.
2. Initialize RC522.
3. Load configuration.
4. Connect to Wi-Fi.
5. Authenticate with backend.
6. Send initial heartbeat.
7. Start RFID scanning loop.

## 15.2 RFID Scan

When RC522 detects a card:

1. Read UID.
2. Convert UID to canonical format.
3. Send HTTPS request.
4. Receive server response.
5. Show success/error using buzzer/LED.
6. Prevent accidental immediate duplicate scans.
7. Return to scan state.

## 15.3 Device Heartbeat

Send periodically:

```json
{
  "device_id": "pt_esp_001",
  "firmware_version": "1.0.0",
  "uptime": 123456,
  "wifi_rssi": -54
}
```

Recommended interval:

> 30–60 seconds

## 15.4 Offline Behavior

MVP should at minimum:

- detect lost Wi-Fi,
- retry connection,
- show offline status,
- continue attempting reconnection.

Advanced offline attendance queue can be a post-MVP enhancement.

---

# 16. Backend API

All hardware requests go through the PresenTap backend.

## 16.1 Device Heartbeat

`POST /api/device/heartbeat`

Request:

```json
{
  "device_id": "pt_esp_001",
  "firmware_version": "1.0.0",
  "uptime": 123456,
  "wifi_rssi": -54
}
```

Response:

```json
{
  "success": true,
  "server_time": "2026-08-16T10:30:00Z"
}
```

## 16.2 RFID Registration Scan

`POST /api/device/rfid/register`

Request:

```json
{
  "uid": "A3B71C92"
}
```

The backend identifies the authenticated device.

The registration process must be tied to an active admin enrollment session.

## 16.3 Attendance Scan

`POST /api/device/attendance`

Request:

```json
{
  "uid": "A3B71C92",
  "scanned_at": "2026-08-16T10:35:10Z"
}
```

Backend:

1. Authenticate device.
2. Resolve device organization.
3. Resolve device class.
4. Find student by RFID UID.
5. Ensure student is active.
6. Ensure student belongs to device organization.
7. Ensure student belongs to device's assigned class.
8. Check duplicate attendance.
9. Insert attendance event.
10. Return result.

Success response:

```json
{
  "success": true,
  "status": "present",
  "student": {
    "name": "Rishab Gautam",
    "roll_number": "11"
  },
  "message": "Attendance marked"
}
```

Duplicate response:

```json
{
  "success": true,
  "status": "already_present",
  "message": "Attendance already marked"
}
```

Unknown card:

```json
{
  "success": false,
  "status": "unknown_card",
  "message": "RFID card is not registered"
}
```

Wrong class:

```json
{
  "success": false,
  "status": "wrong_class",
  "message": "Student is not assigned to this device's class"
}
```

---

# 17. Attendance Rules

## 17.1 Primary Rule

One student can have at most one `present` record per class per attendance date in the MVP.

## 17.2 Duplicate Protection

If the same card is scanned multiple times:

```text
First scan:
PRESENT

Second scan:
ALREADY PRESENT
```

Do not create duplicate attendance rows.

## 17.3 Attendance Date

Attendance should use a server-defined date rather than trusting the ESP8266 clock for the official date.

## 17.4 Timestamp

Store the server timestamp for authoritative records.

The device timestamp may be stored as metadata if required.

---

# 18. Attendance Database Design

Recommended core tables:

## organizations

```text
id
name
type
logo_url
created_at
updated_at
```

## profiles

```text
id
organization_id
full_name
role
created_at
updated_at
```

## classes

```text
id
organization_id
name
section
academic_year
room
status
created_at
updated_at
```

## students

```text
id
organization_id
class_id
full_name
roll_number
student_identifier
rfid_uid
status
created_at
updated_at
```

## devices

```text
id
organization_id
class_id
name
device_type
device_token_hash
status
firmware_version
last_seen_at
created_at
updated_at
```

## attendance

```text
id
organization_id
student_id
class_id
device_id
attendance_date
marked_at
status
source
created_at
```

Recommended statuses:

```text
present
absent
late
```

For MVP, only `present` needs to be generated automatically. `absent` can be derived for students with no attendance record.

## device_events

Optional but recommended:

```text
id
device_id
event_type
payload
created_at
```

Useful event types:

```text
heartbeat
attendance_scan
rfid_registration
error
```

---

# 19. Database Constraints

Important constraints:

1. Student RFID UID must be unique among active students within an organization.
2. Student roll number should be unique within a class.
3. Device ID must be globally unique.
4. Attendance must prevent duplicates.
5. Every attendance record must reference a valid student, class, organization, and device.
6. Archived students should not receive new attendance.
7. Disabled devices cannot submit attendance.

Attendance uniqueness should be enforced at the database level, not only in application code.

Recommended logical unique key:

```text
(student_id, class_id, attendance_date)
```

---

# 20. Security Model

## 20.1 Web Authentication

Use Supabase Auth.

## 20.2 Data Isolation

Every organization-owned record must include:

```text
organization_id
```

Use Supabase Row Level Security (RLS) so users cannot access another organization's records.

## 20.3 Hardware Authentication

ESP8266 must not use:

- Supabase service-role key,
- database password,
- unrestricted admin credentials.

Instead use:

> Device-specific credential/token → backend verification → authorized operation.

## 20.4 Secret Storage

- Store only a secure hash of device credentials when possible.
- Never commit device tokens to Git.
- Never expose server secrets in frontend code.
- Never expose service-role credentials in ESP8266 firmware.

## 20.5 API Abuse Protection

MVP should include:

- basic request validation,
- device authentication,
- rate limiting for public/device endpoints where practical,
- input validation,
- safe error messages.

---

# 21. Dashboard Requirements

## 21.1 Overview

Dashboard should display:

```text
Today's Attendance

Total Students      45
Present              41
Absent                4
Attendance           91.1%

Devices
ESP-11A-01            Online
```

## 21.2 Recent Attendance

Show:

```text
Student         Class       Time       Status
Rishab          11-A        08:42      Present
Aman            11-A        08:43      Present
Priya           11-A        08:44      Present
```

## 21.3 Realtime Update

When ESP8266 submits a valid scan:

- database row is created,
- dashboard updates without manual refresh,
- recent event appears,
- present count increases.

Use Supabase Realtime or equivalent server-sent update mechanism.

---

# 22. Device Status

Device card:

```text
ESP-11A-01

● Online

Class:
11-A

Last seen:
8 seconds ago

Firmware:
1.0.0

Wi-Fi:
-54 dBm
```

Offline:

```text
● Offline

Last seen:
6 minutes ago
```

MVP online definition:

> Device has successfully communicated with the backend within the configured timeout.

---

# 23. Reports

## 23.1 Daily Report

Show:

- date,
- class,
- total students,
- present,
- absent,
- percentage.

## 23.2 Student Report

Show:

- student,
- class,
- total days,
- present count,
- absent count,
- percentage.

## 23.3 Class Report

Show:

- class,
- date range,
- average attendance,
- student-wise status.

## 23.4 Export

Provide:

> Export CSV

CSV columns:

```text
Date
Student Name
Roll Number
Class
Status
Marked At
Device
```

---

# 24. Required Web Pages

## Public

`/`

Landing page explaining:

- problem,
- product,
- how it works,
- hardware,
- CTA.

## Authentication

`/login`  
`/signup`  
`/forgot-password`

## Admin

`/dashboard`

`/dashboard/classes`

`/dashboard/classes/[classId]`

`/dashboard/students`

`/dashboard/students/[studentId]`

`/dashboard/devices`

`/dashboard/devices/[deviceId]`

`/dashboard/attendance`

`/dashboard/reports`

`/dashboard/settings`

## Setup

`/setup/organization`

`/setup/device`

`/setup/device/[deviceId]`

`/setup/rfid/[studentId]`

## Terminal / Device Monitoring

Optional MVP page:

`/dashboard/device-monitor`

---

# 25. UI/UX Requirements

## Design Direction

The product should feel like a modern, trustworthy education SaaS rather than an electronics dashboard.

Use:

- clean layout,
- strong typography,
- responsive design,
- clear status indicators,
- simple tables,
- clear empty states,
- confirmation dialogs for destructive actions,
- toast notifications.

## Important UX Principle

A non-technical school administrator should be able to understand the system without knowing:

- Arduino,
- ESP8266,
- APIs,
- databases,
- RFID protocols.

Technical details should be progressively disclosed.

---

# 26. Onboarding Wizard

The onboarding wizard should guide the admin.

## Step 1

```text
Welcome to PresenTap
Create your institution
```

## Step 2

```text
Create your first class
```

## Step 3

```text
Add students
```

## Step 4

```text
Connect attendance device
```

## Step 5

```text
Register RFID cards
```

## Step 6

```text
You're ready!

Ask a student to tap their card.
```

---

# 27. Hardware Setup Instructions

PresenTap should provide an interactive hardware setup guide.

## RC522 → ESP8266

For a NodeMCU ESP8266 using SPI:

```text
RC522        ESP8266 NodeMCU
--------------------------------
3.3V   --->  3V3
GND    --->  GND
SDA/SS --->  D2
SCK    --->  D5
MOSI   --->  D7
MISO   --->  D6
RST    --->  D1
```

The implementation should verify the exact board/pin configuration before final firmware release.

## Important Hardware Rule

RC522 should be powered from **3.3V**, not 5V.

---

# 28. Firmware UX

Firmware should provide simple physical feedback:

## Successful attendance

- short beep
- green LED

## Unknown card

- different/error beep
- red LED

## Already marked

- distinct beep
- yellow/orange LED if available

## Network offline

- periodic indicator
- automatic Wi-Fi reconnect attempt

If a buzzer/LED is not included in the physical MVP, Serial Monitor messages may be used during development.

---

# 29. Error Handling

System must handle:

### Unknown RFID

```text
Card not registered.
```

### Duplicate attendance

```text
Attendance already marked.
```

### Wrong class

```text
Student belongs to another class.
```

### Device offline

Dashboard:

```text
Device offline.
Last seen: 4 minutes ago.
```

### Network failure

ESP8266 retries Wi-Fi connection.

### API failure

Device retries according to safe exponential/backoff rules.

### Invalid device credential

Reject request and mark device as unauthorized.

### Archived student

Do not mark attendance.

---

# 30. Attendance Registration Session

Because RFID enrollment is different from normal attendance, use a controlled enrollment session.

## Flow

```text
Admin selects student
      ↓
Start RFID registration
      ↓
Backend creates short-lived enrollment session
      ↓
ESP8266 scans card
      ↓
Device sends UID + enrollment session/device identity
      ↓
Backend validates session
      ↓
UID linked to selected student
      ↓
Session expires
```

This prevents arbitrary scans from accidentally changing student RFID assignments.

---

# 31. API Security Architecture

Recommended request flow:

```text
ESP8266
   |
   | HTTPS + Device Credential
   v
PresenTap API
   |
   | validate device
   | validate payload
   v
Supabase/PostgreSQL
```

Do NOT use:

```text
ESP8266
   |
   | Supabase service-role key
   v
Database
```

The backend acts as the trusted bridge for hardware requests.

---

# 32. Technology Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons

## Backend

- Next.js server/API routes or dedicated Node.js service
- TypeScript
- Zod for request validation

## Database

- Supabase PostgreSQL

## Authentication

- Supabase Auth

## Realtime

- Supabase Realtime

## Hardware

- ESP8266 NodeMCU
- RC522 MFRC522 RFID reader
- 13.56 MHz compatible RFID cards/tags

## Firmware

- Arduino framework
- ESP8266WiFi
- secure HTTP client
- MFRC522 library

## Communication

- HTTPS
- JSON REST API

## Deployment

Web app and backend can be deployed to a platform compatible with the chosen Next.js architecture.

---

# 33. Recommended Project Structure

```text
presen-tap/
│
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── setup/
│   ├── api/
│   │   ├── device/
│   │   │   ├── attendance/
│   │   │   ├── heartbeat/
│   │   │   └── rfid/
│   │   └── ...
│   └── ...
│
├── components/
│   ├── dashboard/
│   ├── students/
│   ├── classes/
│   ├── devices/
│   ├── attendance/
│   └── ui/
│
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── api/
│   ├── validation/
│   └── device/
│
├── types/
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── firmware/
│   └── esp8266-rc522/
│       ├── src/
│       ├── include/
│       └── README.md
│
├── docs/
│   ├── hardware-setup.md
│   ├── api.md
│   └── deployment.md
│
├── .env.example
├── README.md
└── package.json
```

---

# 34. Environment Variables

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

SUPABASE_SERVICE_ROLE_KEY=
DEVICE_AUTH_SECRET=
API_BASE_URL=
```

Never commit real secret values.

---

# 35. MVP Acceptance Criteria

The product cannot be considered MVP-complete until all of the following work:

## Account

- [ ] Admin can create an account.
- [ ] Admin can log in.
- [ ] Admin can log out.

## Organization

- [ ] Admin can create institution.
- [ ] Institution data is isolated.

## Classes

- [ ] Admin can create class.
- [ ] Admin can edit class.
- [ ] Admin can archive class.

## Students

- [ ] Admin can add student.
- [ ] Admin can edit student.
- [ ] Admin can archive student.
- [ ] Admin can search/filter students.

## RFID

- [ ] RFID UID can be registered.
- [ ] Duplicate UID is rejected.
- [ ] RFID UID is linked to correct student.

## Device

- [ ] ESP8266 device can be created.
- [ ] Device has unique ID.
- [ ] Device has secure credential.
- [ ] Device can authenticate.
- [ ] Device sends heartbeat.
- [ ] Dashboard shows device status.

## Attendance

- [ ] ESP8266 reads RC522 UID.
- [ ] ESP8266 successfully sends attendance request.
- [ ] Backend identifies student.
- [ ] Attendance is stored.
- [ ] Duplicate scans do not create duplicate attendance.
- [ ] Unknown cards are rejected.
- [ ] Wrong-class cards are rejected.
- [ ] Archived students are rejected.

## Dashboard

- [ ] Attendance count updates.
- [ ] Recent attendance appears.
- [ ] Device status appears.
- [ ] No manual refresh is required for normal realtime updates.

## Reports

- [ ] Daily attendance is viewable.
- [ ] Student history is viewable.
- [ ] Class history is viewable.
- [ ] CSV export works.

---

# 36. Hardware Acceptance Test

The following physical test is mandatory:

### Test Setup

```text
Laptop
   |
Internet/Wi-Fi
   |
ESP8266
   |
RC522
```

Student record:

```text
Name: Test Student
Class: 11-A
RFID UID: TEST-UID
```

### Test

1. Power ESP8266.
2. ESP8266 connects to Wi-Fi.
3. Dashboard shows device online.
4. Student taps registered RFID card.
5. RC522 reads UID.
6. ESP8266 sends HTTPS request.
7. API validates device.
8. Backend finds student.
9. Attendance is inserted.
10. Dashboard updates.
11. Student is shown as present.
12. Scan same card again.
13. System returns `already_present`.
14. No second attendance record is created.

---

# 37. Performance Targets

MVP targets:

- Dashboard initial load: < 3 seconds on normal broadband.
- API attendance response: ideally < 2 seconds.
- Normal attendance scan-to-dashboard update: ideally < 3 seconds.
- Duplicate attendance check: immediate server-side.
- Device heartbeat update: within heartbeat interval.
- UI should remain usable on desktop and mobile browsers.

These are targets, not hard SLAs.

---

# 38. Reliability Requirements

The system should:

- automatically reconnect ESP8266 Wi-Fi,
- avoid duplicate database records,
- handle temporary API failures gracefully,
- validate all incoming hardware payloads,
- never crash because of an invalid RFID UID,
- display meaningful errors,
- maintain server-authoritative attendance timestamps.

Post-MVP:

- local scan queue,
- offline attendance mode,
- conflict resolution,
- automatic firmware OTA.

---

# 39. Future Roadmap

## Phase 2 — Face Attendance

Allow users to choose:

```text
Face Attendance
    ↓
Laptop camera
OR
Phone camera
```

No dedicated hardware required.

## Phase 3 — Additional Hardware

- Raspberry Pi
- ESP32-CAM
- other RFID controllers
- multiple device stations

## Phase 4 — Smart Automation

- low attendance alerts,
- late arrival workflows,
- scheduled reports,
- parent notifications,
- teacher notifications.

## Phase 5 — AI Hardware Advisor

User describes:

> "I have 3 classrooms, 150 students and ₹5,000 budget."

PresenTap recommends an appropriate deployment.

Important: AI recommendations should assist the user; they should not replace explicit user selection.

---

# 40. Hackathon Demo Flow

The MVP demo should take approximately 3–5 minutes.

## Step 1

Open PresenTap.

> Create a school.

## Step 2

Create class:

```text
11-A
```

## Step 3

Add student:

```text
Rishab Gautam
Roll No: 11
```

## Step 4

Create device:

```text
ESP-11A-01
ESP8266 + RC522
```

## Step 5

Show hardware.

```text
ESP8266 + RC522
```

## Step 6

Register RFID card.

Student taps.

```text
✓ Card registered
```

## Step 7

Show attendance terminal.

Student taps again.

```text
✓ Rishab Gautam
Present
08:42 AM
```

## Step 8

Dashboard updates live.

```text
11-A

Present: 1
Absent: 44
```

## Step 9

Scan same card again.

```text
Already marked
```

## Step 10

Export report.

This demonstrates the complete system rather than only a UI prototype.

---

# 41. Product Differentiator

PresenTap is not merely:

> "an RFID attendance app."

Its core value is:

> **A platform for creating and managing attendance infrastructure.**

The MVP proves this with:

```text
Configure
   ↓
Provision
   ↓
Connect Hardware
   ↓
Tap
   ↓
Record
   ↓
Monitor
```

---

# 42. Product Principles

1. **Simple for institutions.**
2. **Reliable at the point of attendance.**
3. **Hardware should be inexpensive and replaceable.**
4. **The backend remains the source of truth.**
5. **Security must be designed from day one.**
6. **Do not overbuild the MVP.**
7. **Future device types must fit behind the same attendance API.**

---

# 43. Final MVP Definition

The first release of PresenTap is complete when a non-technical school administrator can:

> Create a school → create a class → add a student → register an RFID card → connect an ESP8266 + RC522 → have the device appear online → scan the card → automatically record attendance → see the attendance update on the dashboard → export the record.

That is the minimum bar for calling the product a **working MVP**.

---

# 44. Implementation Priority

## P0 — Must Work

- Authentication
- Organization
- Classes
- Students
- Supabase schema
- Device registration
- Device authentication
- ESP8266 + RC522 firmware
- RFID registration
- Attendance API
- Attendance database
- Duplicate prevention
- Live dashboard
- Device heartbeat

## P1 — Required Before Demo

- Student search/filter
- Attendance history
- CSV export
- Device management UI
- Error states
- Hardware setup guide
- Production-like deployment

## P2 — Polish

- Animations
- Advanced analytics
- Improved reports
- Branding refinements
- Onboarding improvements

---

# 45. Definition of Done

PresenTap MVP is done only when:

**Software + cloud + physical hardware work together in one complete loop.**

```text
            ┌───────────────────┐
            │     PresenTap     │
            │    Web Dashboard  │
            └─────────┬─────────┘
                      │
                    API
                      │
              ┌───────▼────────┐
              │    Supabase    │
              │   PostgreSQL   │
              └───────┬────────┘
                      ▲
                      │ HTTPS
                      │
              ┌───────┴────────┐
              │    ESP8266     │
              │       │        │
              │     RC522      │
              └───────┬────────┘
                      │
                  RFID Card
                      │
                   Student
```

**PresenTap MVP = one complete, reliable RFID attendance loop.**
