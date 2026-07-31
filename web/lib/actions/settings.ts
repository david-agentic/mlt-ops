"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { requireRole } from "@/lib/auth/guard";

const DAILY_SHIPPING_GOAL_KEY = "daily_shipping_goal";
const DEFAULT_DAILY_SHIPPING_GOAL = 20;

export async function getDailyShippingGoal(): Promise<number> {
  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, DAILY_SHIPPING_GOAL_KEY))
    .limit(1);
  return row ? Number(row.value) : DEFAULT_DAILY_SHIPPING_GOAL;
}

export async function setDailyShippingGoal(goal: number) {
  await requireRole("admin");
  if (!Number.isFinite(goal) || goal < 1) throw new Error("Enter a valid goal.");

  await db
    .insert(appSettings)
    .values({ key: DAILY_SHIPPING_GOAL_KEY, value: String(Math.round(goal)) })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: String(Math.round(goal)), updatedAt: new Date() },
    });

  revalidatePath("/admin");
}
