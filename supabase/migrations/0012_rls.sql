-- 0012_rls.sql
-- Row-Level Security: every organization-owned table is isolated by the
-- caller's organization (resolved from their profile). Device requests are
-- served by the Next.js API using the server service-role client, which
-- bypasses RLS after verifying the device credential (Backend Schema §8).

-- Resolves the caller's organization from their profile.
--
-- IMPLEMENTATION NOTE (preserving Backend Schema.md §8.2 semantics): the
-- function is declared SECURITY DEFINER with a fixed search_path. This is
-- required, not optional: every RLS policy below (including the `profiles`
-- policy itself) calls this function, and it selects from `public.profiles`.
-- A SECURITY INVOKER function doing so would re-trigger RLS on `profiles` and
-- produce "infinite recursion detected in policy for relation profiles",
-- breaking ALL RLS. SECURITY DEFINER makes the inner read bypass RLS so the
-- policy can evaluate. The inner query is filtered by `id = auth.uid()`, so
-- the function can only ever return the *caller's own* organization — it does
-- not widen access to other organizations.
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Enable RLS on all organization-owned tables.
ALTER TABLE public.organizations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfid_enrollment_sessions ENABLE ROW LEVEL SECURITY;

-- Generic org-isolated policies (select + write within own org).
-- NOTE: the `organizations` table is the organization itself, so its own PK
-- `id` IS the organization id (it has no `organization_id` column). The policy
-- therefore filters on `id = current_org_id()`. Every other org-owned table
-- carries an `organization_id` FK and is filtered on that column instead.
CREATE POLICY organizations_org_select ON public.organizations FOR SELECT USING (id = public.current_org_id());
CREATE POLICY organizations_org_write  ON public.organizations FOR ALL
  USING (id = public.current_org_id())
  WITH CHECK (id = public.current_org_id());

CREATE POLICY classes_org_select ON public.classes FOR SELECT USING (organization_id = public.current_org_id());
CREATE POLICY classes_org_write  ON public.classes FOR ALL
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY students_org_select ON public.students FOR SELECT USING (organization_id = public.current_org_id());
CREATE POLICY students_org_write  ON public.students FOR ALL
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY devices_org_select ON public.devices FOR SELECT USING (organization_id = public.current_org_id());
CREATE POLICY devices_org_write  ON public.devices FOR ALL
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY attendance_org_select ON public.attendance FOR SELECT USING (organization_id = public.current_org_id());
CREATE POLICY attendance_org_write  ON public.attendance FOR ALL
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

CREATE POLICY enroll_org_select ON public.rfid_enrollment_sessions FOR SELECT USING (organization_id = public.current_org_id());
CREATE POLICY enroll_org_write  ON public.rfid_enrollment_sessions FOR ALL
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

-- profiles: a user can always read/update their own row; admins may see/read
-- org members. No anon write path exists.
CREATE POLICY profiles_self_or_org ON public.profiles FOR ALL
  USING (id = auth.uid() OR organization_id = public.current_org_id())
  WITH CHECK (id = auth.uid() OR organization_id = public.current_org_id());

-- device_events: org reached via the device; SELECT only. Device writes go
-- through the API/service-role client, never the anon client (Backend Schema §8.6).
CREATE POLICY device_events_org ON public.device_events FOR SELECT USING (
  device_id IN (SELECT id FROM public.devices WHERE organization_id = public.current_org_id())
);
