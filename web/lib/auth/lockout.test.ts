import { describe, it, expect } from "vitest";
import { checkLockout } from "./lockout";

describe("checkLockout", () => {
  it("is not locked when lockedUntil is null", () => {
    expect(checkLockout({ lockedUntil: null }).locked).toBe(false);
  });

  it("is not locked when lockedUntil is in the past", () => {
    const result = checkLockout({ lockedUntil: new Date(Date.now() - 1000) });
    expect(result.locked).toBe(false);
  });

  it("is locked when lockedUntil is in the future", () => {
    const result = checkLockout({ lockedUntil: new Date(Date.now() + 5 * 60 * 1000) });
    expect(result.locked).toBe(true);
  });

  it("reports a sensible retry-after in minutes", () => {
    const result = checkLockout({ lockedUntil: new Date(Date.now() + 10 * 60 * 1000) });
    if (!result.locked) throw new Error("expected locked");
    expect(result.retryAfterMinutes).toBeGreaterThanOrEqual(9);
    expect(result.retryAfterMinutes).toBeLessThanOrEqual(10);
  });
});
