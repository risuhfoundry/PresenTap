-- supabase/seed.sql
-- Demo / hackathon seed data (fictional). Run after migrations, e.g. via
-- `supabase db reset` (which applies migrations then this file) or manually.
--
-- No fake auth credentials are created (no profiles / auth.users rows).
-- The device_token_hash below is HMAC_SHA256('presenTap-mvp-demo-secret',
-- '4f9c2b8e1a7d3f6c0b5e2a9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b'),
-- i.e. a valid demo credential whose raw token is shown only in dev.

BEGIN;

-- Organization
INSERT INTO public.organizations (id, name, type)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Greenfield Public School', 'school');

-- Class 11-A
INSERT INTO public.classes (id, organization_id, name, section, academic_year, room, status)
VALUES ('6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '11', 'A', '2026-27', 'Lab 2', 'active');

-- Students (org: Greenfield, class: 11-A, status: active)
INSERT INTO public.students (id, organization_id, class_id, full_name, roll_number, student_identifier, rfid_uid, status)
VALUES
  ('6ba7b810-9dad-11d1-80b4-00c04fd430c9', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Rishab Gautam', '11', 'GPR-001', 'A3B71C92', 'active'),
  ('6ba7b810-9dad-11d1-80b4-00c04fd430ca', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Aman Verma',   '12', 'GPR-002', 'C4D82E11', 'active'),
  ('6ba7b810-9dad-11d1-80b4-00c04fd430cb', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Priya Nair',   '13', 'GPR-003', '7F19A6B3', 'active'),
  ('6ba7b810-9dad-11d1-80b4-00c04fd430cc', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Dev Sharma',   '14', 'GPR-004', NULL,       'active');

-- Device (ESP8266 + RC522)
INSERT INTO public.devices (id, organization_id, class_id, name, device_type, device_token_hash, status, firmware_version, last_seen_at)
VALUES ('pt_esp_DEMO00000123',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        'ESP-11A-01', 'ESP8266_RC522',
        '7a10f33a9e78a3e6488dab7144931ec8b8c557bbd39dca3b92dcf27b0e0deac1',
        'active', '1.0.0', now());

-- Sample attendance (Rishab present today, via the device)
INSERT INTO public.attendance (organization_id, student_id, class_id, device_id, status, source)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c9',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        'pt_esp_DEMO00000123', 'present', 'device');

-- Device event (heartbeat)
INSERT INTO public.device_events (device_id, event_type, payload)
VALUES ('pt_esp_DEMO00000123', 'heartbeat', '{"uptime": 12345, "wifi_rssi": -54, "firmware_version": "1.0.0"}'::jsonb);

-- Enrollment session (Dev Sharma, who has no RFID yet, pending on the device)
INSERT INTO public.rfid_enrollment_sessions (organization_id, student_id, device_id, status, expires_at)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430cc',
        'pt_esp_DEMO00000123', 'pending', now() + INTERVAL '5 minutes');

COMMIT;
