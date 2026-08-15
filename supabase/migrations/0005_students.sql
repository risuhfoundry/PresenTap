-- 0005_students.sql
CREATE TABLE public.students (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  class_id           uuid        NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  full_name          text        NOT NULL,
  roll_number        text,
  student_identifier text,
  rfid_uid           text,
  status             text        NOT NULL DEFAULT 'active',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.students
  ADD CONSTRAINT chk_students_status
    CHECK (status IN ('active', 'archived'));

ALTER TABLE public.students
  ADD CONSTRAINT chk_students_name_len
    CHECK (char_length(full_name) BETWEEN 1 AND 120);

-- RFID UID uniqueness: one UID per ACTIVE student within an organization
-- (PRD §12, §19-1; Backend Schema §6.1). Canonical form is UPPERCASE HEX, no
-- separators. Archived students (or NULL rfid_uid) do not collide.
CREATE UNIQUE INDEX uq_students_rfid_active
  ON public.students (organization_id, rfid_uid)
  WHERE status = 'active' AND rfid_uid IS NOT NULL;

-- Roll number uniqueness within a class (PRD §19-2; Backend Schema §6.2).
CREATE UNIQUE INDEX uq_students_roll_active
  ON public.students (class_id, roll_number)
  WHERE status = 'active' AND roll_number IS NOT NULL;
