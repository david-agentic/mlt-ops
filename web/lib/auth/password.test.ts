import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, DUMMY_PASSWORD_HASH } from "./password";

describe("password hashing", () => {
  it("verifies a correct password against its own hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const a = await hashPassword("same password");
    const b = await hashPassword("same password");
    expect(a).not.toBe(b);
    expect(await verifyPassword("same password", a)).toBe(true);
    expect(await verifyPassword("same password", b)).toBe(true);
  });

  it("rejects against the dummy hash used for timing-safe nonexistent-user checks", async () => {
    expect(await verifyPassword("anything", DUMMY_PASSWORD_HASH)).toBe(false);
  });

  it("rejects a malformed stored hash instead of throwing", async () => {
    expect(await verifyPassword("anything", "not-a-real-hash")).toBe(false);
  });
});
