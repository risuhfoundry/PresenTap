-- 0001_extensions.sql
-- Enable pgcrypto. On Supabase Postgres this provides gen_random_uuid() and
-- hmac(). gen_random_uuid() is also a core function in PostgreSQL 13+, so the
-- schema does not hard-depend on this extension for UUID generation.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
