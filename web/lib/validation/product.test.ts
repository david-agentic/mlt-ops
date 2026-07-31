import { describe, it, expect } from "vitest";
import { productSchema } from "./product";

describe("productSchema", () => {
  it("accepts a valid product", () => {
    const result = productSchema.safeParse({
      sku: "MLT-001",
      name: "Premium Widget A",
      description: "A widget",
      unitPrice: "24.99",
      costPrice: "16.24",
      unit: "box",
      stockOnHand: "200",
      incomingStock: "50",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing SKU", () => {
    const result = productSchema.safeParse({
      sku: "",
      name: "Premium Widget A",
      unitPrice: "24.99",
      unit: "box",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative unit price", () => {
    const result = productSchema.safeParse({
      sku: "MLT-001",
      name: "Premium Widget A",
      unitPrice: "-5",
      unit: "box",
    });
    expect(result.success).toBe(false);
  });

  it("allows an empty cost price (optional)", () => {
    const result = productSchema.safeParse({
      sku: "MLT-001",
      name: "Premium Widget A",
      unitPrice: "24.99",
      costPrice: "",
      unit: "box",
    });
    expect(result.success).toBe(true);
  });

  it("defaults stock fields to 0 when omitted", () => {
    const result = productSchema.safeParse({
      sku: "MLT-001",
      name: "Premium Widget A",
      unitPrice: "24.99",
      unit: "box",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stockOnHand).toBe(0);
      expect(result.data.incomingStock).toBe(0);
    }
  });
});
