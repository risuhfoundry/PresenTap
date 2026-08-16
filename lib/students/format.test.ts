import { describe, it, expect } from "vitest";
import {
  rfidStatus,
  rfidStatusLabel,
  studentStatusLabel,
  classStatusLabel,
} from "@/lib/students/format";

describe("rfidStatus", () => {
  it("is registered for a non-empty uid", () => {
    expect(rfidStatus({ rfid_uid: "AA:BB:CC" })).toBe("registered");
  });

  it("is unregistered when uid is null", () => {
    expect(rfidStatus({ rfid_uid: null })).toBe("unregistered");
  });

  it("is unregistered when uid is an empty string", () => {
    expect(rfidStatus({ rfid_uid: "" })).toBe("unregistered");
  });

  it("is unregistered when uid is whitespace only", () => {
    expect(rfidStatus({ rfid_uid: "   " })).toBe("unregistered");
  });
});

describe("rfidStatusLabel", () => {
  it("labels registered and unregistered", () => {
    expect(rfidStatusLabel("registered")).toBe("Registered");
    expect(rfidStatusLabel("unregistered")).toBe("Not registered");
  });
});

describe("status labels", () => {
  it("studentStatusLabel maps active/archived", () => {
    expect(studentStatusLabel("active")).toBe("Active");
    expect(studentStatusLabel("archived")).toBe("Archived");
  });

  it("classStatusLabel maps active/archived", () => {
    expect(classStatusLabel("active")).toBe("Active");
    expect(classStatusLabel("archived")).toBe("Archived");
  });
});
