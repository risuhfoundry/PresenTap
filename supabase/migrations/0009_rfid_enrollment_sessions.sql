-- 0009_rfid_enrollment_sessions.sql
-- Short-lived session that ties an in-progress RFID registration to a specific
-- student + device, so an arbitrary scan cannot reassign a student's RFID
-- (PRD §12, §30; Backend Schema §5.8 / CD-11).
CREATE TABLE public.rfid_enrollment_sessions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  student_id       uuid        NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  device_id        text        NOT NULL REFERENCES public.devices(id) ON DELETE RESTRICT,
  status           text        NOT NULL DEFAULT 'pending',
  expires_at       timestamptz NOT NULL DEFAULT now() + INTERVAL '5 minutes',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rfid_enrollment_sessions
  ADD CONSTRAINT chk_enroll_status
    CHECK (status IN ('pending', 'completed', 'expired', 'cancelled'));

-- Fast lookup of the active pending session for a device (Backend Schema §7).
CREATE INDEX idx_enroll_pending
  ON public.rfid_enrollment_sessions (device_id, status, expires_at);
