import { describe, it, expect } from "vitest";
import { formatMoney, formatRelativeTime, greetingForTime } from "./format";

describe("formatMoney", () => {
  it("formats a number as GBP", () => {
    expect(formatMoney(24.99)).toBe("£24.99");
  });

  it("formats a numeric string the same as a number", () => {
    expect(formatMoney("24.99")).toBe(formatMoney(24.99));
  });

  it("formats zero correctly", () => {
    expect(formatMoney(0)).toBe("£0.00");
  });
});

describe("formatRelativeTime", () => {
  it("says 'just now' for very recent timestamps", () => {
    expect(formatRelativeTime(new Date(Date.now() - 5 * 1000))).toBe("just now");
  });

  it("formats minutes ago", () => {
    expect(formatRelativeTime(new Date(Date.now() - 5 * 60 * 1000))).toBe("5m ago");
  });

  it("formats hours ago", () => {
    expect(formatRelativeTime(new Date(Date.now() - 3 * 60 * 60 * 1000))).toBe("3h ago");
  });

  it("formats days ago", () => {
    expect(formatRelativeTime(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))).toBe("2d ago");
  });
});

describe("greetingForTime", () => {
  it("greets morning hours", () => {
    expect(greetingForTime(new Date("2026-01-01T09:00:00"))).toBe("Good morning");
  });

  it("greets afternoon hours", () => {
    expect(greetingForTime(new Date("2026-01-01T14:00:00"))).toBe("Good afternoon");
  });

  it("greets evening hours", () => {
    expect(greetingForTime(new Date("2026-01-01T20:00:00"))).toBe("Good evening");
  });
});
