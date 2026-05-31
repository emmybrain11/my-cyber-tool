import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { scanResults, defenseActivity, systemHealth } from "@db/schema";
import { desc, sql, eq, and, gte } from "drizzle-orm";

export const dashboardRouter = createRouter({
  stats: publicQuery.query(async () => {
    const db = getDb();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [
      _totalScansResult,
      activeScansResult,
      scansTodayResult,
      threatsResult,
      assetsResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(scanResults),
      db.select({ count: sql<number>`count(*)` }).from(scanResults).where(eq(scanResults.status, "running")),
      db.select({ count: sql<number>`count(*)` }).from(scanResults).where(gte(scanResults.createdAt, today)),
      db.select({ count: sql<number>`count(*)` }).from(defenseActivity).where(
        and(
          eq(defenseActivity.severity, "high"),
          eq(defenseActivity.status, "active")
        )
      ),
      db.select().from(systemHealth).where(eq(systemHealth.metric, "total_assets")),
    ]);
    
    return {
      totalAssets: assetsResult[0] ? Number(assetsResult[0].value) : 4271,
      activeScans: activeScansResult[0]?.count ?? 0,
      scansToday: scansTodayResult[0]?.count ?? 0,
      threatsDetected: threatsResult[0]?.count ?? 0,
    };
  }),

  recentActivity: publicQuery
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 10;
      
      const events = await db.select().from(defenseActivity)
        .orderBy(desc(defenseActivity.createdAt))
        .limit(limit);
      
      return { activity: events };
    }),
});
