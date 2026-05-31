import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { defenseActivity } from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const defenseRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        severity: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      
      if (input?.severity) {
        conditions.push(sql`${defenseActivity.severity} = ${input.severity}`);
      }
      if (input?.status) {
        conditions.push(sql`${defenseActivity.status} = ${input.status}`);
      }
      
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      
      const [events, countResult] = await Promise.all([
        db.select().from(defenseActivity).where(where).orderBy(desc(defenseActivity.createdAt)).limit(input?.limit ?? 20).offset(input?.offset ?? 0),
        db.select({ count: sql<number>`count(*)` }).from(defenseActivity).where(where),
      ]);
      
      return { events, total: countResult[0]?.count ?? 0 };
    }),

  create: publicQuery
    .input(
      z.object({
        eventType: z.string(),
        description: z.string(),
        source: z.string().optional(),
        target: z.string().optional(),
        severity: z.string().optional(),
        mitreTechnique: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(defenseActivity).values({
        eventType: input.eventType as "block" | "alert" | "quarantine" | "mitigate" | "monitor",
        description: input.description,
        source: input.source ?? null,
        target: input.target ?? null,
        severity: (input.severity as "low" | "medium" | "high" | "critical") ?? "medium",
        mitreTechnique: input.mitreTechnique ?? null,
      });
      return { id: Number(result[0].insertId), ...input };
    }),

  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(defenseActivity)
        .set({ status: input.status as "active" | "resolved" | "false_positive" })
        .where(eq(defenseActivity.id, input.id));
      const result = await db.select().from(defenseActivity).where(eq(defenseActivity.id, input.id));
      return result[0];
    }),
});
