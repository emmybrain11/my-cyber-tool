import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb, checkDbConnection, isUsingSqliteFallback } from "./queries/connection";
import { systemHealth } from "@db/schema";
import { desc } from "drizzle-orm";

export const healthRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    // Get latest record per metric
    const metrics = await db.select().from(systemHealth).orderBy(desc(systemHealth.recordedAt));
    
    // Deduplicate by metric name, keeping the latest
    const seen = new Set<string>();
    const deduped = metrics.filter((m: any) => {
      if (seen.has(m.metric)) return false;
      seen.add(m.metric);
      return true;
    });
    
    return { metrics: deduped };
  }),

  update: adminQuery
    .input(
      z.object({
        metric: z.string(),
        value: z.number(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(systemHealth).values({
        metric: input.metric,
        value: String(input.value),
        status: (input.status as "healthy" | "degraded" | "critical") ?? "healthy",
      });
      return { id: Number(result[0].insertId), ...input };
    }),
  db: publicQuery.query(async () => {
    try {
      await checkDbConnection(2000);
      return { ok: true, db: true, sqliteFallback: isUsingSqliteFallback() };
    } catch (err) {
      return { ok: false, db: false, error: String(err), sqliteFallback: isUsingSqliteFallback() };
    }
  }),
});
