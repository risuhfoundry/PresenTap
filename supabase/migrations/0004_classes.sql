-- 0004_classes.sql
CREATE TABLE public.classes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  name            text        NOT NULL,
  section         text,
  academic_year   text,
  room            text,
  status          text        NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classes
  ADD CONSTRAINT chk_classes_status
    CHECK (status IN ('active', 'archived'));

ALTER TABLE public.classes
  ADD CONSTRAINT chk_classes_name_len
    CHECK (char_length(name) BETWEEN 1 AND 60);
