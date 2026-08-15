-- 0008_device_events.sql
-- Audit/telemetry log for the device. organization_id is intentionally NOT
-- stored here; reach it via devices.organization_id for RLS (Backend Schema §5.7).
CREATE TABLE public.device_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   text        NOT NULL REFERENCES public.devices(id) ON DELETE RESTRICT,
  event_type  text        NOT NULL,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.device_events
  ADD CONSTRAINT chk_device_events_type
    CHECK (event_type IN ('heartbeat', 'attendance_scan', 'rfid_registration', 'error'));
