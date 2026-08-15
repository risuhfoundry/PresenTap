-- 0011_indexes.sql
-- Remaining secondary indexes from Backend Schema §7. (The two partial unique
-- indexes for students and the enrollment pending index are created in their
-- respective table migrations.)
CREATE INDEX idx_students_org              ON public.students (organization_id);
CREATE INDEX idx_students_class            ON public.students (class_id);
CREATE INDEX idx_classes_org               ON public.classes (organization_id);
CREATE INDEX idx_devices_org               ON public.devices (organization_id);
CREATE INDEX idx_devices_class             ON public.devices (class_id);
CREATE INDEX idx_attendance_org_date       ON public.attendance (organization_id, attendance_date);
CREATE INDEX idx_attendance_class_date     ON public.attendance (class_id, attendance_date);
CREATE INDEX idx_attendance_student        ON public.attendance (student_id);
CREATE INDEX idx_attendance_date           ON public.attendance (attendance_date);
CREATE INDEX idx_device_events_device_created ON public.device_events (device_id, created_at DESC);
CREATE INDEX idx_profiles_org              ON public.profiles (organization_id);
