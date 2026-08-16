import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

/**
 * `cn` is used by every UI component to merge Tailwind classes. It must merge
 * without throwing and resolve conflicts (later wins) so component variants
 * override base classes as expected.
 */

describe("cn", () => {
  it("joins multiple class strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("resolves Tailwind conflicts so the later class wins", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("merges conditional variants", () => {
    expect(cn("text-sm", true && "font-bold", false && "hidden")).toBe("text-sm font-bold");
  });
});
