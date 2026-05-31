import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { scanResults } from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const scanRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        module: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      
      if (input?.module) {
        conditions.push(sql`${scanResults.module} = ${input.module}`);
      }
      if (input?.status) {
        conditions.push(sql`${scanResults.status} = ${input.status}`);
      }
      
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      
      const [scans, countResult] = await Promise.all([
        db.select().from(scanResults).where(where).orderBy(desc(scanResults.createdAt)).limit(input?.limit ?? 20).offset(input?.offset ?? 0),
        db.select({ count: sql<number>`count(*)` }).from(scanResults).where(where),
      ]);
      
      return { scans, total: countResult[0]?.count ?? 0 };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(scanResults).where(eq(scanResults.id, input.id));
      return result[0] ?? null;
    }),

  create: publicQuery
    .input(
      z.object({
        module: z.string(),
        target: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(scanResults).values({
        module: input.module,
        target: input.target ?? null,
        status: "pending",
      });
      return { id: Number(result[0].insertId), ...input, status: "pending" };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        status: z.string().optional(),
        findings: z.any().optional(),
        summary: z.string().optional(),
        duration: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...updates } = input;
      const updateData: Record<string, unknown> = {};
      
      if (updates.status) updateData.status = updates.status;
      if (updates.findings) updateData.findings = updates.findings;
      if (updates.summary) updateData.summary = updates.summary;
      if (updates.duration) updateData.duration = updates.duration;
      
      if (updates.status === "completed" || updates.status === "failed") {
        updateData.completedAt = new Date();
      }
      
      await db.update(scanResults).set(updateData).where(eq(scanResults.id, id));
      const result = await db.select().from(scanResults).where(eq(scanResults.id, id));
      return result[0];
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(scanResults).where(eq(scanResults.id, input.id));
      return { success: true };
    }),
});
