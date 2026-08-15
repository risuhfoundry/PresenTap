-- 0006_devices.sql
-- ESP8266 + RC522 attendance station. The raw device token is NEVER stored;
-- only its HMAC-SHA256(DEVICE_AUTH_SECRET, token) hash is kept.
CREATE TABLE public.devices (
  id                text        PRIMARY KEY,
  organization_id   uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  class_id          uuid        NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  name              text        NOT NULL,
  device_type       text        NOT NULL DEFAULT 'ESP8266_RC522',
  device_token_hash text        NOT NULL,
  status            text        NOT NULL DEFAULT 'active',
  firmware_version  text,
  last_seen_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.devices
  ADD CONSTRAINT chk_devices_status
    CHECK (status IN ('active', 'disabled'));

ALTER TABLE public.devices
  ADD CONSTRAINT chk_devices_type
    CHECK (device_type IN ('ESP8266_RC522'));

ALTER TABLE public.devices
  ADD CONSTRAINT chk_devices_name_len
    CHECK (char_length(name) BETWEEN 1 AND 60);

-- Public id format: "pt_esp_" (7 chars) + 12 base62 chars = 19 total.
ALTER TABLE public.devices
  ADD CONSTRAINT chk_devices_id_fmt
    CHECK (char_length(id) = 19 AND id LIKE 'pt_esp_%');
