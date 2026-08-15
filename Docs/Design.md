# PresenTap — Design

**Status:** UI / Visual Source of Truth
**Companion docs:** `PRD.md`, `Architecture.md`, `Backend Schema.md`, `Rules.md`, `Phases.md`.

> This document defines how PresenTap must look and feel: a modern, minimal, professional education SaaS — not an Arduino tool, not an IoT control panel. Every screen, component, color, and spacing value here is binding for implementation.

---

## 1. Core Visual Direction

PresenTap should feel like a trustworthy product a real school or college would adopt. Think **Linear / Vercel / Stripe / Notion** discipline — generous whitespace, confident but restrained type, subtle borders, one accent color, clear status. **Do not clone any of them**; build an original "PresenTap" identity around the idea of a confident *tap*.

It should NOT look like:
- Arduino software or an electronics IDE
- A generic IoT/device control panel
- A bootstrap admin template
- A flashy "AI startup"
- A game UI

### 1.1 Personality
- **Calm, confident, premium.** The hardware complexity is invisible; the UI speaks the administrator's language (classes, students, presence) — never GPIO, SPI, or APIs.
- **Quiet by default.** Color appears only where it carries meaning (a CTA, an active nav item, a status). Most of the screen is neutral.

---

## 2. Color System

Neutral-first. One accent. Status colors used sparingly.

### 2.1 Neutrals (light theme)
| Token | Hex | Usage |
|-------|-----|-------|
| `bg` (page) | `#FFFFFF` | App background |
| `bg-subtle` | `#FAFAFA` | Sections, empty states |
| `bg-muted` | `#F4F4F5` | Hover, chips, soft fills |
| `border` | `#E4E4E7` | Default borders |
| `border-strong` | `#D4D4D8` | Emphasized borders |
| `text-primary` | `#18181B` (near-black) | Headings, body emphasis |
| `text-secondary` | `#52525B` | Body |
| `text-muted` | `#71717A` | Metadata, helper text |
| `text-inverse` | `#FAFAFA` | On accent/dark surfaces |

### 2.2 Accent (PresenTap indigo)
Used for: primary CTA, active navigation, links, important actions, focus ring.
| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#4F46E5` | Primary actions, active states |
| `accent-hover` | `#4338CA` | Hover/pressed |
| `accent-soft` | `#EEF2FF` | Tinted backgrounds (selected row, soft badge) |
| `accent-ring` | `rgba(79,70,229,0.45)` | Focus ring |

> Accent is intentionally a calm indigo (distinct from Stripe's `#635BFF` and Vercel's black), giving PresenTap its own identity while reading as "trustworthy."

### 2.3 Status
| State | Hex (text) | Hex (bg) | Meaning |
|-------|-----------|----------|---------|
| Success / Online / Present | `#16A34A` | `#DCFCE7` | OK, live, marked |
| Error / Offline / Reject | `#DC2626` | `#FEE2E2` | Failure, offline, rejected |
| Warning / Pending | `#D97706` | `#FEF3C7` | Awaiting, duplicate, caution |
| Info / Neutral | `#6B7280` | `#F3F4F6` | Secondary state |

### 2.4 Rules
- Never place text below 4.5:1 contrast on its background.
- Do not use more than one accent at a time.
- Status colors appear only on badges, indicators, and the specific feedback moments in §6.

---

## 3. Typography

Font: **Inter** (with system-ui fallback). Load via `next/font`. Tabular numerals for counts/timestamps.

| Role | Size | Weight | Line-height | Example |
|------|------|--------|-------------|---------|
| Page heading | 30px | 700 | 36px | "Dashboard" |
| Section heading | 20px | 600 | 28px | "Recent Attendance" |
| Card heading | 16px | 600 | 24px | "Class Overview" |
| Body | 14px | 400 | 21px | Table rows, paragraphs |
| Body strong | 14px | 600 | 21px | Emphasized values |
| Metadata | 12px | 500 | 16px | timestamps, "8s ago" |
| Label | 13px | 600 | 18px | Form labels |
| Helper | 12px | 400 | 16px | field hints, muted |

- Letter-spacing: `-0.01em` on headings ≥20px; `0` elsewhere.
- Truncate long names with ellipsis; never wrap headings awkwardly.

---

## 4. Spacing (8px scale)

Base unit 4px; primary rhythm in multiples of 8.
`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`
- Card padding: `24px` (inner), `16px` tight variants.
- Section gap: `32px`.
- Stack gap (lists): `12px` or `16px`.
- Page padding (desktop): `32px`.

---

## 5. Radii & Shadows

| Element | Radius |
|---------|--------|
| Button / Input / Select | `8px` (`rounded-lg`) |
| Card / Dialog / Table container | `12px` (`rounded-xl`) |
| Avatar / Badge pill | `9999px` |
| Focus ring | `6px` outline, `accent-ring` |

Shadows (subtle, never heavy):
- Card: `0 1px 2px rgba(24,24,27,0.04), 0 1px 3px rgba(24,24,27,0.06)`
- Dialog/Popover: `0 8px 24px rgba(24,24,27,0.12)`
- Hover lift (cards): `0 2px 8px rgba(24,24,27,0.08)`

No drop shadows on flat surfaces (sidebar, topbar). Borders do the separation.

---

## 6. Components

All built on `components/ui/*` (shadcn). Keep borders/subtle shadows per §5.

### 6.1 Button
- Variants: `primary` (accent bg, white text), `secondary` (white bg, border, text-primary), `ghost` (transparent, text-secondary, hover bg-muted), `danger` (red text/border, hover red-soft).
- Height: `40px` default, `36px` sm, `44px` lg. Radius 8px. Font 14px/600.
- Loading: spinner inside, disabled. Icon + label allowed (Lucide, 16px).

### 6.2 Input
- Height 40px, border `border`, radius 8px, padding `8px 12px`. Focus: 1px `accent` border + `accent-ring`.
- Label above (13px/600); helper text below (12px muted); error text red below.
- Placeholder: `text-muted`.

### 6.3 Select
- Same metrics as Input. Custom trigger with chevron. Options in a popover card.

### 6.4 Card
- White bg, `border`, radius 12px, padding 24px, subtle shadow. Optional `CardHeader` (heading + action) and `CardContent`.

### 6.5 Badge
- Pill, 12px/600, padding `2px 8px`. Variants: `neutral` (muted bg), `accent` (accent-soft), `success` (green), `warning` (amber), `danger` (red), `outline` (border only). Used for status (Online/Offline, Present/Absent, Active/Archived).

### 6.6 Table
- Bordered container, radius 12px, header row `bg-subtle`, 13px/600 uppercase-ish muted labels (not literally uppercase—use 12px/600 muted), rows 14px. Hover: `bg-subtle`. Dividers: `border`. Right-align numeric columns. Empty: dedicated empty state rows.

### 6.7 Dialog
- Centered card, radius 12px, overlay `rgba(24,24,27,0.4)`. Used for create/edit/confirm-destructive. Title 20px/600; footer with primary + ghost/secondary. **Destructive actions always confirm** (archive/disable/delete).

### 6.8 Dropdown
- Popover card, radius 8px, items 14px with icon+label; hover `bg-muted`. Used for row actions (⋯).

### 6.9 Tabs
- Underline style; active tab `text-primary` + 2px `accent` underline; inactive `text-muted`. 14px/600.

### 6.10 Alert
- Left border accent by variant; icon + title + message. Used for inline errors/warnings (e.g., device offline banner).

### 6.11 Toast
- Bottom-right (or top-right) card, radius 10px, icon + message; success green, error red. Auto-dismiss 4s. Used for "Saved", "RFID registered", errors.

### 6.12 Empty State
- Centered: 48px muted icon, 16px/600 heading, 14px muted subtext, one primary CTA. e.g., "No classes yet — Create your first class".

### 6.13 Skeleton
- `bg-muted` rounded blocks matching final layout; subtle pulse. Used during initial load.

### 6.14 Navigation (sidebar)
- Items: icon (Lucide 18px) + label 14px/500. Active: `accent-soft` bg, `accent` text + 2px left accent bar. Hover: `bg-muted`. Section groups with 12px/600 muted group labels.

---

## 7. Layout

### 7.1 Desktop shell
```text
┌───────────────┬─────────────────────────────────────┐
│ Sidebar (256) │ Topbar (h-16, border-b)             │
│               ├─────────────────────────────────────┤
│ Navigation    │ Main Content                        │
│               │ max-w-6xl, mx-auto, p-8             │
│               │                                     │
└───────────────┴─────────────────────────────────────┘
```
- Sidebar: 256px (`w-64`), white, right border, logo top, nav groups, user/org footer bottom.
- Topbar: 64px (`h-16`), border-bottom, page-context actions on right (search, create, user menu), optional breadcrumb/title left.
- Main: `max-w-6xl` centered, padding 32px; vertical gap 32px between sections.

### 7.2 Responsive
- `< 768px`: sidebar hidden → bottom tab bar (5 items) or hamburger drawer; topbar collapses to title + menu; tables scroll horizontally or stack; cards full-width.
- `768–1024px`: sidebar persists (can be icon-only at very narrow); content single-column.
- `≥1024px`: full shell as above.

---

## 8. Required Pages

For each: purpose, layout, primary action, secondary actions, components, loading/empty/error, responsive.

### `/` Landing (public)
- **Purpose:** explain the product; convert to sign-up.
- **Layout:** centered hero, generous whitespace. Headline **"Tap. Record. Done."**; subtext "Build and manage a simple, reliable RFID attendance system for your school or college."; primary CTA **Get Started**; secondary **See How It Works** (scrolls to a 5-step diagram: RFID Card → RC522 → ESP8266 → PresenTap → Attendance Dashboard). Footer with minimal links.
- **Components:** hero, feature row (3 cards: Simple, Reliable, Hardware-agnostic), how-it-works strip, CTA band.
- **Loading/empty/error:** static; no states.
- **Responsive:** single column on mobile; hero scales.

### `/login` · `/signup` · `/forgot-password` (auth)
- **Layout:** centered card (max-w-sm) on `bg-subtle`, logo above. Email + password fields; primary button. Signup shows password + confirm. Forgot-password shows email only. Links between the three.
- **Primary:** Sign in / Create account / Send reset link.
- **Components:** Input, Button, Alert (on error), link text.
- **Loading:** button spinner. **Error:** inline Alert ("Invalid email or password"). **Empty:** n/a.
- **Responsive:** card full-width with margin on mobile.

### `/dashboard` (overview)
- **Purpose:** answer (1) how many present, (2) how many absent, (3) is hardware working, (4) what happened recently.
- **Layout:**
  - Greeting: "Good morning, Admin" (16px/600) + date (metadata).
  - Stat row (4 cards): **Total Students**, **Present**, **Absent**, **Attendance Rate %**. Each: label (12px/600 muted), value (30px/700 tabular), subtle delta/context (metadata).
  - **Recent Attendance** table (student, class, time, status badge).
  - **Class Overview** (per-class present/total mini cards or compact table).
  - **Device Health** (device name, Online/Offline badge, last seen, rssi).
- **Primary:** none global; per-section "View all" links.
- **Secondary:** refresh is automatic (realtime).
- **Components:** StatCard, Table, Badge, Skeleton, Alert (offline banner if any device offline).
- **Loading:** skeletons for stats + table. **Empty:** "No classes yet — create one" / "No attendance today yet." **Error:** Alert + retry.
- **Realtime:** new attendance inserts a row at top with fade; present count +1; device badge flips to online on heartbeat.
- **Responsive:** stat cards 2×2 then 4-col; tables scroll.

### `/dashboard/classes` & `/dashboard/classes/[classId]`
- **List:** table of classes (name/section, room, students count, status badge, actions ⋯). Primary **Create Class** (dialog: name, section, academic_year, room). Search/filter.
- **Detail:** header (name-section, status), stat (students count), student roster table (name, roll, RFID status badge), device assigned, edit/archive actions, attendance tab (recent for this class).
- **States:** loading skeletons; empty "No classes"; error Alert.

### `/dashboard/students` & `/dashboard/students/[studentId]`
- **List:** table (name, roll, class, RFID badge [Registered/Unregistered], status). Filters: by class, search by name/roll. Primary **Add Student** (dialog: name, class, roll, student_identifier). Row actions: edit, archive, register RFID (→ setup).
- **Detail:** profile (name, class, roll, identifier, RFID UID or "Not registered" + Register button), attendance history tab (date, status, device), archive action.
- **States:** loading; empty "Add your first student"; error.

### `/dashboard/devices` & `/dashboard/devices/[deviceId]`
- **List:** table (name, class, type, status badge, online/offline badge, last seen). Primary **Create Device**. 
- **Detail:** name, class, type, **Online/Offline** (derived), last seen ("8 seconds ago"), firmware version, Wi-Fi rssi, enable/disable, rotate token, view config/download, recent device_events (heartbeat/scan/error) timeline.
- **Token UX:** shown **once** at creation in a dialog with masked display + "Copy" + "Download config"; thereafter only "Rotate" (generates new, shows once). Never shown in plaintext in lists.
- **States:** loading; empty "Connect your first device"; offline Alert.

### `/dashboard/attendance`
- **Purpose:** historical attendance.
- **Layout:** filters (date, class, student search) + table (date, student, roll, class, status, marked at, device). Infinite scroll or pagination.
- **Primary:** filters; **Export CSV** (columns: Date, Student Name, Roll Number, Class, Status, Marked At, Device).
- **States:** loading skeletons; empty "No records for this filter."

### `/dashboard/reports`
- **Purpose:** daily / date-range / student / class reports.
- **Layout:** report type tabs (Daily, Student, Class). Controls (date range, class select). Result table + summary (total, present, absent, %). CSV export.
- **States:** loading; empty "Select a range."

### `/dashboard/settings`
- **Purpose:** organization profile + account.
- **Layout:** sections — Organization (name, type school/college, logo url), Account (name, email, password reset), Danger/advanced (optional). Save per section.
- **States:** loading; save toast; validation errors inline.

### `/setup/organization`
- **Purpose:** onboarding step — create institution.
- **Layout:** centered card, progress indicator (step 1/6). Fields: institution name, type (School/College segmented control), optional logo URL. Primary **Continue**.
- **States:** loading; error Alert.

### `/setup/device`
- **Purpose:** create + configure a device.
- **Layout:** card. Device Name input, Class select, Hardware (fixed "ESP8266 + RC522" chip). Primary **Create Device** → success view with Device ID + Token (once) + Download Configuration + View Setup Instructions.
- **Simple language:** avoid GPIO/SPI/API terms; technical detail behind "Advanced / details".

### `/setup/device/[deviceId]`
- **Purpose:** connect & verify hardware.
- **Layout:** step flow: Configure → Connect Hardware (wiring diagram, 3.3V note) → Verify Device (polls online status) → Ready. Status badges per step. "Advanced" shows config.
- **Responsive:** steps stack vertically on mobile.

### `/setup/rfid/[studentId]`
- **Purpose:** register a student's RFID card (see §9).

### `/dashboard/device-monitor` (optional)
- Live terminal-style feed of device_events for debugging; not required for MVP demo.

---

## 9. RFID Registration Experience (critical)

Extremely simple. The admin never sees firmware internals.

```text
Register RFID

Rishab Gautam
11-A · Roll No. 11

┌────────────────────────────────────┐
│                                    │
│       Waiting for card...          │
│                                    │
│   Tap the RFID card on reader      │
│                                    │
└────────────────────────────────────┘
                        [ Cancel ]
```

States (each a distinct UI + physical feedback mapping):
- **waiting** — prompt "Tap the RFID card on reader"; device in enroll mode (blue LED).
- **detecting** — brief "Detecting…" on receiving the request.
- **success** —
  ```text
  ✓ RFID Registered
  UID: A3B71C92
  Student: Rishab Gautam
  Class: 11-A
  ```
  green check, success toast.
- **duplicate** — "This card is already assigned to another student." (original unchanged); red/amber alert.
- **timeout** — if session expires (5 min) with no scan: "No card detected. Try again." + Retry.
- **offline** — if device unreachable: "Device is offline. Check the connection." 
- **cancelled** — admin cancels; session revoked.

Device select: at start, admin picks which connected device performs the scan (dropdown of org devices). Backend opens the enrollment session for that device+student.

---

## 10. Device Setup Experience

Admin needs zero hardware knowledge.
```text
Create Device
    ↓
Configure
    ↓
Connect Hardware
    ↓
Verify Device
    ↓
Ready
```
- Use plain language: "Connect the reader to the device using the included pins" with a visual diagram; "Power it on; we'll detect it automatically."
- Technical info (device ID, token, API URL, firmware version, SPI pins) lives behind an **Advanced / details** disclosure.

---

## 11. Attendance Feedback (on dashboard / terminal)

Mapped from API outcomes (`Architecture.md` §3.8):

**Success**
```text
✓ Attendance marked
Rishab Gautam
11-A
08:42 AM
```
**Duplicate**
```text
Already marked
Attendance was already recorded today.
```
**Unknown**
```text
Card not registered
```
**Wrong class**
```text
Wrong class
```

Physical feedback on the device (PRD §28): present=green+beep; unknown=red+error beep; already=amber+distinct beep; offline=periodic indicator+reconnect.

---

## 12. Animation

Subtle only:
- Hover: 120–160ms ease on buttons/cards/rows.
- Fade-in: new realtime attendance row (200ms).
- Skeleton: soft pulse during load.
- State transitions: badge/status changes (color cross-fade).
- Dialog: 120ms scale/opacity.
No parallax, no excessive motion. Respect `prefers-reduced-motion` (disable non-essential animation).

---

## 13. Accessibility

- Keyboard: full tab order; Esc closes dialogs; focus trap in modals; visible focus ring (`accent-ring`).
- ARIA: `aria-label` on icon buttons; `role="status"` on live attendance region; `aria-live="polite"` for toasts/counts.
- Contrast: ≥4.5:1 for text; status colors paired with text/icon, never color-alone.
- Semantic HTML: `nav`, `main`, `table`, `th scope`, `label for`.
- Touch-friendly: controls ≥36px tap target.
- Labels: every input has a visible label; helper text associated via `aria-describedby`.

---

## 14. UX Principle

The underlying hardware complexity must be invisible. The user should feel:

> **Create class → Add students → Connect device → Start attendance.**

Not:

> **Configure an ESP8266.**

Every screen speaks in classes, students, and presence. Device provisioning hides SPI/GPIO/API behind "Connect Hardware" and an Advanced disclosure.

---

## 15. Consistency Notes (binding)

- Accent `#4F46E5`; never introduce a second brand color.
- Inter only; do not mix font families.
- 8px spacing; 12px card radius; subtle shadows only.
- Status colors fixed in §2.3; reuse the same badge variants everywhere.
- The RFID registration and attendance-feedback strings in §9–§11 are the canonical copy; reuse exactly.
- Any new page must follow the shell in §7 and the component specs in §6.
