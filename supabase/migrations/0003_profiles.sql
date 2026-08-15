-- 0003_profiles.sql
-- One row per Supabase Auth user. Links the auth identity to an organization
-- and a role. id = auth.users.id (cascade delete with the auth user).
CREATE TABLE public.profiles (
  id               uuid        PRIMARY KEY,
  organization_id  uuid        REFERENCES public.organizations(id) ON DELETE RESTRICT,
  full_name        text        NOT NULL,
  role             text        NOT NULL DEFAULT 'admin',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Supabase provides the auth.users table; the FK validates the referenced row.
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_auth_user
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_role
    CHECK (role IN ('admin', 'teacher'));

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_name_len
    CHECK (char_length(full_name) BETWEEN 1 AND 120);
