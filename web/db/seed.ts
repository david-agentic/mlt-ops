import "dotenv/config";
import { db } from "./index";
import { users, resellers, products } from "./schema";
import { hashPassword } from "../lib/auth/password";

async function main() {
  console.log("Seeding demo data...");

  const [reseller1] = await db
    .insert(resellers)
    .values({
      companyName: "Northgate Traders Ltd",
      contactName: "Amara Whitfield",
      email: "amara@northgatetraders.example",
      phone: "+44 7700 900123",
      address: "12 Mill Lane, Manchester, UK",
    })
    .returning();

  const [reseller2] = await db
    .insert(resellers)
    .values({
      companyName: "Riverside Wholesale Co",
      contactName: "Tom OKeeffe",
      email: "tom@riversidewholesale.example",
      phone: "+44 7700 900456",
      address: "8 Harbour Road, Bristol, UK",
    })
    .returning();

  await db.insert(products).values([
    {
      sku: "MLT-001",
      name: "Premium Widget A",
      description: "Standard-grade widget, box of 50",
      unitPrice: "24.99",
      costPrice: "16.24",
      unit: "box",
      stockOnHand: 200,
      incomingStock: 50,
    },
    {
      sku: "MLT-002",
      name: "Premium Widget B",
      description: "Heavy-duty widget, box of 25",
      unitPrice: "39.50",
      costPrice: "25.68",
      unit: "box",
      stockOnHand: 200,
      incomingStock: 50,
    },
    {
      sku: "MLT-003",
      name: "Widget Accessory Pack",
      description: "Mounting kit, pack of 10",
      unitPrice: "12.75",
      costPrice: "8.29",
      unit: "pack",
      stockOnHand: 200,
      incomingStock: 50,
    },
    {
      sku: "MLT-004",
      name: "Bulk Widget Pallet",
      description: "Full pallet, 500 units",
      unitPrice: "899.00",
      costPrice: "584.35",
      unit: "pallet",
      stockOnHand: 200,
      incomingStock: 50,
    },
  ]);

  const demoUsers = [
    {
      email: "admin@mltops.demo",
      name: "Admin User",
      role: "admin" as const,
      resellerId: null,
    },
    {
      email: "finance@mltops.demo",
      name: "Finance User",
      role: "finance" as const,
      resellerId: null,
    },
    {
      email: "shipping@mltops.demo",
      name: "Shipping User",
      role: "shipping" as const,
      resellerId: null,
    },
    {
      email: "reseller1@mltops.demo",
      name: "Amara Whitfield",
      role: "reseller" as const,
      resellerId: reseller1.id,
    },
    {
      email: "reseller2@mltops.demo",
      name: "Tom OKeeffe",
      role: "reseller" as const,
      resellerId: reseller2.id,
    },
  ];

  const passwordHash = await hashPassword("password123");

  await db.insert(users).values(
    demoUsers.map((u) => ({
      ...u,
      passwordHash,
    })),
  );

  console.log("Seed complete. Demo login password for all accounts: password123");
  demoUsers.forEach((u) => console.log(`  ${u.role.padEnd(10)} ${u.email}`));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
