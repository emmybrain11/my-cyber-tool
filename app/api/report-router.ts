import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { reports, scanResults, cyberRangeLogs, defenseActivity } from "@db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export const reportRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      
      const [reportList, countResult] = await Promise.all([
        db.select().from(reports)
          .where(eq(reports.userId, userId))
          .orderBy(desc(reports.createdAt))
          .limit(input?.limit ?? 20)
          .offset(input?.offset ?? 0),
        db.select({ count: sql<number>`count(*)` })
          .from(reports)
          .where(eq(reports.userId, userId)),
      ]);
      
      return { reports: reportList, total: countResult[0]?.count ?? 0 };
    }),

  generate: authedQuery
    .input(
      z.object({
        name: z.string(),
        moduleFilter: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      
      // Build date filters
      const dateConditions = [];
      if (input.dateFrom) {
        dateConditions.push(gte(scanResults.createdAt, input.dateFrom));
      }
      if (input.dateTo) {
        dateConditions.push(lte(scanResults.createdAt, input.dateTo));
      }
      const whereScans = dateConditions.length > 0 ? and(...dateConditions) : undefined;
      
      // Fetch data
      const [scans, logs, defenseEvents] = await Promise.all([
        db.select().from(scanResults).where(whereScans).orderBy(desc(scanResults.createdAt)).limit(1000),
        db.select().from(cyberRangeLogs).orderBy(desc(cyberRangeLogs.createdAt)).limit(1000),
        db.select().from(defenseActivity).orderBy(desc(defenseActivity.createdAt)).limit(1000),
      ]);
      
      // Filter by module if specified
      const filteredScans = input.moduleFilter && input.moduleFilter !== "all"
        ? scans.filter((s: any) => s.module === input.moduleFilter)
        : scans;
      
      // Build report JSON
      const reportData = {
        generatedAt: new Date().toISOString(),
        generatedBy: ctx.user.name ?? ctx.user.email ?? "unknown",
        filter: {
          moduleFilter: input.moduleFilter ?? "all",
          dateFrom: input.dateFrom?.toISOString() ?? null,
          dateTo: input.dateTo?.toISOString() ?? null,
        },
        summary: {
          totalScans: filteredScans.length,
          totalCyberRangeLogs: logs.length,
          totalDefenseEvents: defenseEvents.length,
          scansByModule: filteredScans.reduce((acc: Record<string, number>, s: any) => {
            const mod = s.module ?? 'unknown';
            acc[mod] = (acc[mod] ?? 0) + 1;
            return acc;
          }, {}),
          defenseBySeverity: defenseEvents.reduce((acc: Record<string, number>, d: any) => {
            const sev = d.severity ?? 'unknown';
            acc[sev] = (acc[sev] ?? 0) + 1;
            return acc;
          }, {}),
        },
        scanResults: filteredScans,
        cyberRangeLogs: logs,
        defenseActivity: defenseEvents,
      };
      
      // Store report metadata
      const result = await db.insert(reports).values({
        userId,
        name: input.name,
        moduleFilter: input.moduleFilter ?? "all",
        dateFrom: input.dateFrom ?? null,
        dateTo: input.dateTo ?? null,
        scanCount: filteredScans.length,
        logCount: logs.length,
        defenseCount: defenseEvents.length,
        fileUrl: `/api/reports/download/${Date.now()}`,
      });
      
      const reportId = Number(result[0].insertId);
      
      return {
        report: { id: reportId, ...input, userId },
        downloadUrl: `/api/reports/download/${reportId}`,
        reportData,
      };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.select().from(reports)
        .where(and(eq(reports.id, input.id), eq(reports.userId, ctx.user.id)));
      return result[0] ?? null;
    }),
});
