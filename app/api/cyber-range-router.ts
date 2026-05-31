import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { cyberRangeLogs } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const cyberRangeRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        scenario: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const where = input?.scenario 
        ? sql`${cyberRangeLogs.scenario} = ${input.scenario}` 
        : undefined;
      
      const [logs, countResult] = await Promise.all([
        db.select().from(cyberRangeLogs).where(where).orderBy(desc(cyberRangeLogs.createdAt)).limit(input?.limit ?? 20).offset(input?.offset ?? 0),
        db.select({ count: sql<number>`count(*)` }).from(cyberRangeLogs).where(where),
      ]);
      
      return { logs, total: countResult[0]?.count ?? 0 };
    }),

  create: publicQuery
    .input(
      z.object({
        scenario: z.string(),
        action: z.string(),
        details: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(cyberRangeLogs).values({
        scenario: input.scenario,
        action: input.action as "started" | "completed" | "failed" | "checkpoint",
        details: input.details ?? null,
      });
      return { id: Number(result[0].insertId), ...input };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(cyberRangeLogs).where(eq(cyberRangeLogs.id, input.id));
      return { success: true };
    }),
});
