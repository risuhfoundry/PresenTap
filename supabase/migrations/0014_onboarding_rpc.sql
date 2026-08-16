-- 0014_onboarding_rpc.sql
-- Atomic organization creation during first-time onboarding (Phase 2).
--
-- WHY THIS EXISTS:
-- A brand-new admin has profile.organization_id = NULL until onboarding
-- completes. The organizations RLS write policy (organizations_org_write in
-- 0012_rls.sql) requires id = public.current_org_id(), which is NULL for a
-- not-yet-onboarded user. So the authenticated anon client CANNOT insert the
-- first organization (classic chicken-and-egg). This SECURITY DEFINER RPC
-- performs the organization INSERT + profile.organization_id link inside a
-- single transaction, bypassing RLS for those writes only, while still scoping
-- everything to the authenticated caller. This keeps the service-role key
-- server-only (Rules.md §4.6) — no secret is exposed to the browser.
--
-- SECURITY PROPERTIES:
--  - Runs as DEFINER (postgres) so the org INSERT/UPDATE bypass RLS. The caller
--    identity is read from auth.uid() *inside* the function; the organization or
--    user id is NEVER taken from arguments (Rules.md §4.6: never trust a
--    client-supplied organization_id).
--  - Duplicate-onboarding protection (Phase 2 T8): if the profile already has an
--    organization, the existing organization is returned unchanged and NO second
--    organization is created.
--  - Fixed search_path prevents search_path injection.
--  - EXECUTE is granted to `authenticated` only (not PUBLIC/anon).
--
-- NOTE: The result is returned via RETURN NEXT with explicit OUT-parameter
-- assignment (not RETURN QUERY SELECT <variables>) to avoid PL/pgSQL's
-- "column reference is ambiguous" between RETURN TABLE columns and local
-- variables.

CREATE OR REPLACE FUNCTION public.create_organization_onboarding(
  p_name      text,
  p_type      text,
  p_logo_url  text DEFAULT NULL
)
RETURNS TABLE (
  id       uuid,
  name     text,
  type     text,
  logo_url text,
  created  boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user_id  uuid;
  v_existing uuid;
  v_org_id   uuid;
  v_name     text;
  v_type     text;
  v_logo     text;
BEGIN
  -- Caller identity comes from the session, never from arguments.
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING errcode = '42501';
  END IF;

  -- Validate inputs (defense in depth; the table CHECKs also enforce these).
  IF p_name IS NULL OR char_length(trim(p_name)) < 1 OR char_length(p_name) > 120 THEN
    RAISE EXCEPTION 'invalid_name' USING errcode = '22023';
  END IF;
  IF p_type IS NULL OR p_type NOT IN ('school', 'college') THEN
    RAISE EXCEPTION 'invalid_type' USING errcode = '22023';
  END IF;

  -- Lock the caller's profile row to serialize concurrent onboarding attempts.
  -- Qualify `profiles.id`: `id` is also an OUT parameter of this function, so an
  -- unqualified reference is ambiguous ("column reference id is ambiguous",
  -- SQLSTATE 42702) and fails every authenticated call.
  SELECT organization_id INTO v_existing
  FROM public.profiles
  WHERE profiles.id = v_user_id
  FOR UPDATE;

  -- The signup flow must create the profile row first.
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found' USING errcode = 'P0001';
  END IF;

  -- Already onboarded: return the existing organization, do NOT create a second.
  IF v_existing IS NOT NULL THEN
    -- Select into local variables first (NOT the OUT parameters) to avoid
    -- PL/pgSQL's "column reference is ambiguous" between the RETURN TABLE
    -- columns (id/name/type/logo_url) and the organizations columns of the same
    -- name. Assign to the OUT params afterward, exactly like the create branch.
    SELECT o.id, o.name, o.type, o.logo_url
      INTO v_org_id, v_name, v_type, v_logo
      FROM public.organizations o
      WHERE o.id = v_existing;
    id := v_org_id;
    name := v_name;
    type := v_type;
    logo_url := v_logo;
    created := false;
    RETURN NEXT;
    RETURN;
  END IF;

  v_name := trim(p_name);
  v_type := p_type;
  v_logo := NULLIF(trim(p_logo_url), '');

  -- Create the organization (DEFINER bypasses the org RLS write policy).
  INSERT INTO public.organizations (name, type, logo_url)
  VALUES (v_name, v_type, v_logo)
  RETURNING organizations.id INTO v_org_id;

  -- Link the caller's profile to the new organization (same transaction).
  UPDATE public.profiles
  SET organization_id = v_org_id,
      updated_at = now()
  WHERE profiles.id = v_user_id;

  id := v_org_id;
  name := v_name;
  type := v_type;
  logo_url := v_logo;
  created := true;
  RETURN NEXT;
  RETURN;
END;
$$;

-- Only authenticated (signed-in) users may invoke this. The function is
-- SECURITY DEFINER, so its body runs with definer privileges; we only permit
-- authenticated callers to reach it.
--
-- Supabase grants EXECUTE on public-schema functions to `anon` by default, and
-- `REVOKE ... FROM PUBLIC` does NOT remove that explicit `anon` grant. So we
-- revoke `anon` explicitly to enforce an authenticated-only model. The body's
-- auth.uid() NULL guard remains defense-in-depth. service_role/owner retain
-- their normal ownership privileges.
REVOKE EXECUTE ON FUNCTION public.create_organization_onboarding(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_organization_onboarding(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_onboarding(text, text, text) TO authenticated;
