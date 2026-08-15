-- 0007_attendance.sql
-- One row per valid PRESENT scan. Duplicate scans on the same day are blocked
-- by the unique constraint below (Backend Schema §6.4 / CD-7).
CREATE TABLE public.attendance (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  student_id       uuid        NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  class_id         uuid        NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  device_id        text        NOT NULL REFERENCES public.devices(id) ON DELETE RESTRICT,
  attendance_date  date        NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  marked_at        timestamptz NOT NULL DEFAULT now(),
  status           text        NOT NULL DEFAULT 'present',
  source           text        NOT NULL DEFAULT 'device',
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Core duplicate-prevention constraint (CD-7). The API catches the resulting
-- unique-violation and returns status 'already_present' instead of a 2nd row.
ALTER TABLE public.attendance
  ADD CONSTRAINT uq_attendance_daily
    UNIQUE (student_id, class_id, attendance_date);

ALTER TABLE public.attendance
  ADD CONSTRAINT chk_attendance_status
    CHECK (status IN ('present', 'absent', 'late'));

ALTER TABLE public.attendance
  ADD CONSTRAINT chk_attendance_source
    CHECK (source IN ('device'));

-- Optional DB-level guard: the attendance organization must match the student's
-- organization (Backend Schema §6.6). Defense in depth behind the API check.
CREATE OR REPLACE FUNCTION public.attendance_org_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.organization_id <> (SELECT organization_id FROM public.students WHERE id = NEW.student_id) THEN
    RAISE EXCEPTION 'organization mismatch';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_attendance_org_guard
  BEFORE INSERT OR UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.attendance_org_guard();
