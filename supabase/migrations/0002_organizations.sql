-- 0002_organizations.sql
CREATE TABLE public.organizations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  type        text        NOT NULL DEFAULT 'school',
  logo_url    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations
  ADD CONSTRAINT chk_organizations_type
    CHECK (type IN ('school', 'college'));

ALTER TABLE public.organizations
  ADD CONSTRAINT chk_organizations_name_len
    CHECK (char_length(name) BETWEEN 1 AND 120);
