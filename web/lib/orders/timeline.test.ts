import { describe, it, expect } from "vitest";
import { buildOrderTimeline } from "./timeline";

const baseOrder = {
  createdAt: new Date("2026-01-01T10:00:00Z"),
  status: "pending_payment" as const,
};

describe("buildOrderTimeline", () => {
  it("marks only submission done for a brand-new order", () => {
    const steps = buildOrderTimeline(baseOrder, null, null, null);
    expect(steps[0].done).toBe(true);
    expect(steps[0].timestamp).toEqual(baseOrder.createdAt);
    expect(steps.slice(1).every((s) => !s.done)).toBe(true);
  });

  it("marks the next step as current, not done, when nothing has happened yet", () => {
    const steps = buildOrderTimeline(baseOrder, null, null, null);
    expect(steps[1].current).toBe(true);
    expect(steps[1].done).toBe(false);
  });

  it("marks each step done as real timestamps appear, in order", () => {
    const proof = { submittedAt: new Date("2026-01-01T11:00:00Z") };
    const verification = { verifiedAt: new Date("2026-01-01T12:00:00Z") };
    const shipment = {
      packedAt: new Date("2026-01-01T13:00:00Z"),
      dispatchedAt: null,
      deliveredAt: null,
    };

    const steps = buildOrderTimeline(
      { ...baseOrder, status: "packed" },
      proof,
      verification,
      shipment,
    );

    expect(steps.map((s) => s.done)).toEqual([true, true, true, true, false, false]);
    // "dispatched" is the next actionable step
    expect(steps[4].current).toBe(true);
  });

  it("never fabricates a timestamp for a step that hasn't happened", () => {
    const steps = buildOrderTimeline(baseOrder, null, null, null);
    for (const step of steps.slice(1)) {
      expect(step.timestamp).toBeNull();
    }
  });

  it("shows no current step for a cancelled order", () => {
    const steps = buildOrderTimeline({ ...baseOrder, status: "cancelled" }, null, null, null);
    expect(steps.every((s) => !s.current)).toBe(true);
  });
});
