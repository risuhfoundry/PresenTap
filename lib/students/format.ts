import type { RfidStatus, StudentRow } from "@/lib/types";

/**
 * RFID registration state derived from a student's `rfid_uid`. A non-null,
 * non-empty canonical UID means the card is registered (PRD §12, Backend Schema
 * §5.4). Phase 3 only DISPLAYS this state; enrollment happens in Phase 7.
 */
export function rfidStatus(student: Pick<StudentRow, "rfid_uid">): RfidStatus {
  return student.rfid_uid && student.rfid_uid.trim().length > 0
    ? "registered"
    : "unregistered";
}

/** Human label for the RFID state, used by badges. */
export function rfidStatusLabel(status: RfidStatus): string {
  return status === "registered" ? "Registered" : "Not registered";
}

/** Status label for a student row (Active / Archived). */
export function studentStatusLabel(status: StudentRow["status"]): string {
  return status === "active" ? "Active" : "Archived";
}

/** Status label for a class row (Active / Archived). */
export function classStatusLabel(status: StudentRow["status"]): string {
  return status === "active" ? "Active" : "Archived";
}
