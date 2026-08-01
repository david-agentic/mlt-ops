import { describe, it, expect } from "vitest";
import { passwordSchema } from "./password";

describe("passwordSchema", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("Correct-Horse-9").success).toBe(true);
  });

  it("rejects passwords under 12 characters", () => {
    const result = passwordSchema.safeParse("Short1!");
    expect(result.success).toBe(false);
  });

  it("rejects passwords over 200 characters", () => {
    const result = passwordSchema.safeParse("Aa1!".repeat(60));
    expect(result.success).toBe(false);
  });

  it("rejects passwords with fewer than 3 character classes", () => {
    // 12+ chars, but only lowercase — a single character class.
    const result = passwordSchema.safeParse("abcdefghijkl");
    expect(result.success).toBe(false);
  });

  it("accepts a password with exactly 3 of the 4 character classes", () => {
    expect(passwordSchema.safeParse("lowercaseUPPER123").success).toBe(true);
  });

  it("rejects common/denylisted passwords even if long enough", () => {
    expect(passwordSchema.safeParse("password1234").success).toBe(false);
    expect(passwordSchema.safeParse("PASSWORD1234").success).toBe(false);
  });
});
