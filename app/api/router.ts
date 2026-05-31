import { authRouter } from "./auth-router";
import { scanRouter } from "./scan-router";
import { cyberRangeRouter } from "./cyber-range-router";
import { defenseRouter } from "./defense-router";
import { healthRouter } from "./health-router";
import { reportRouter } from "./report-router";
import { dashboardRouter } from "./dashboard-router";
import { aiRouter } from "./ai-router";
import { toolsRouter } from "./tools-router";
import { adminRouter } from "./admin-router";
import { pythonRouter } from "./python-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  admin: adminRouter,
  ai: aiRouter,
  tools: toolsRouter,
  python: pythonRouter,
  scan: scanRouter,
  cyberRange: cyberRangeRouter,
  defense: defenseRouter,
  health: healthRouter,
  report: reportRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
