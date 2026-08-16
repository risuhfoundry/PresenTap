import { describe, it, expect } from "vitest";
import { classDisplayName, isClassArchived } from "@/lib/classes/format";

describe("classDisplayName", () => {
  it("joins name and section with a hyphen", () => {
    expect(classDisplayName({ name: "11", section: "A" })).toBe("11-A");
  });

  it("returns just the name when section is empty", () => {
    expect(classDisplayName({ name: "11", section: "" })).toBe("11");
  });

  it("returns just the name when section is null", () => {
    expect(classDisplayName({ name: "11", section: null })).toBe("11");
  });

  it("returns just the name when section is whitespace only", () => {
    expect(classDisplayName({ name: "11", section: "   " })).toBe("11");
  });
});

describe("isClassArchived", () => {
  it("is true for archived status", () => {
    expect(isClassArchived({ status: "archived" })).toBe(true);
  });

  it("is false for active status", () => {
    expect(isClassArchived({ status: "active" })).toBe(false);
  });
});
