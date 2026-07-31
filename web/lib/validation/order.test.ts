import { describe, it, expect } from "vitest";
import {
  paymentProofSchema,
  verifyPaymentSchema,
  rejectPaymentSchema,
  packOrderSchema,
  financeNoteSchema,
} from "./order";

describe("paymentProofSchema", () => {
  it("requires a positive claimed amount", () => {
    expect(paymentProofSchema.safeParse({ amountClaimed: "0" }).success).toBe(false);
    expect(paymentProofSchema.safeParse({ amountClaimed: "49.98" }).success).toBe(true);
  });
});

describe("verifyPaymentSchema", () => {
  it("requires a valid payment method", () => {
    const bad = verifyPaymentSchema.safeParse({
      verifiedAmount: "49.98",
      method: "crypto",
    });
    expect(bad.success).toBe(false);

    const good = verifyPaymentSchema.safeParse({
      verifiedAmount: "49.98",
      method: "bank_transfer",
    });
    expect(good.success).toBe(true);
  });

  it("rejects a zero verified amount", () => {
    const result = verifyPaymentSchema.safeParse({
      verifiedAmount: "0",
      method: "cash",
    });
    expect(result.success).toBe(false);
  });
});

describe("rejectPaymentSchema", () => {
  it("requires a non-empty reason", () => {
    expect(rejectPaymentSchema.safeParse({ reason: "" }).success).toBe(false);
    expect(rejectPaymentSchema.safeParse({ reason: "Amount mismatch" }).success).toBe(true);
  });
});

describe("packOrderSchema", () => {
  it("requires courier and tracking number", () => {
    expect(packOrderSchema.safeParse({ courier: "", trackingNumber: "" }).success).toBe(false);
    expect(
      packOrderSchema.safeParse({ courier: "DPD", trackingNumber: "DPD123" }).success,
    ).toBe(true);
  });

  it("allows optional weight and dimensions to be omitted", () => {
    const result = packOrderSchema.safeParse({
      courier: "DPD",
      trackingNumber: "DPD123",
      weightKg: "",
      dimensions: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("financeNoteSchema", () => {
  it("only accepts known note types", () => {
    expect(
      financeNoteSchema.safeParse({ note: "Waiting on reseller", type: "hold" }).success,
    ).toBe(true);
    expect(
      financeNoteSchema.safeParse({ note: "Waiting on reseller", type: "urgent" }).success,
    ).toBe(false);
  });
});
