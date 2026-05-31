import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { checkDbConnection, initializeDb } from "./queries/connection";

const app = new Hono<{ Bindings: HttpBindings }>();

if (!env.isProduction) {
  app.post('/__dev/register', async (c) => {
    try {
      const body = await c.req.json();
      const { registerUser } = await import('./auth');
      const user = await registerUser(body.email, body.password, body.name);
      return c.json({ success: true, user });
    } catch (err) {
      console.error('Dev register error:', err);
      return c.json({ error: String(err) }, 500);
    }
  });
}

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
const trpcHandler = async (c: any) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
};
app.all("/api/trpc", trpcHandler);
app.all("/api/trpc/*", trpcHandler);
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (!env.isProduction) {
  try {
    await initializeDb();
  } catch (err) {
    console.warn("Database initialization failed during dev startup; continuing without DB.", err);
  }
}

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  // Fail fast if DB is unreachable
  try {
    await checkDbConnection(3000);
  } catch (err) {
    console.error("Database connectivity check failed:", err);
    process.exit(1);
  }

  const port = parseInt(process.env.PORT || "8088");
  serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
