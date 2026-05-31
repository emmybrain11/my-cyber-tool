import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";
import mysql from "mysql2/promise";
import { createRequire } from "module";

// Optional sqlite fallback for local dev
let usingSqliteFallback = false;

const fullSchema = { ...schema, ...relations };

let instance: any;

function createMysqlInstance() {
  const pool = mysql.createPool(env.databaseUrl);

  const slowThresholdMs = 200;
  const origQuery = pool.query.bind(pool) as any;
  pool.query = async function (...args: any[]) {
    const start = Date.now();
    try {
      const res = await origQuery(...args);
      const duration = Date.now() - start;
      if (duration > slowThresholdMs) {
        console.warn(`Slow DB query: ${duration}ms`, { sql: args[0] });
      }
      return res;
    } catch (err) {
      throw err;
    }
  };

  usingSqliteFallback = false;
  return drizzleMysql(pool, {
    mode: "planetscale",
    schema: fullSchema,
  }) as any;
}

function initializeSqliteFallback() {
  try {
    const requireFn: any = typeof require !== "undefined" ? require : createRequire(import.meta.url);
    const { drizzle: drizzleSqlite } = requireFn("drizzle-orm/better-sqlite3");
    const Database = requireFn("better-sqlite3");
    const db = new Database(":memory:");
    instance = drizzleSqlite(db, { schema: fullSchema });
    usingSqliteFallback = true;
    console.info("Using in-memory SQLite fallback database (dev mode)");
  } catch (err) {
    console.error("Failed to initialize sqlite fallback. Install better-sqlite3 and drizzle-orm/sqlite3 or set DATABASE_URL.", err);
    throw err;
  }
}

export async function initializeDb(): Promise<void> {
  if (instance) {
    return;
  }

  if (env.databaseUrl) {
    if (env.isProduction) {
      instance = createMysqlInstance();
      return;
    }

    try {
      await checkDbConnection(3000);
      instance = createMysqlInstance();
      return;
    } catch (err) {
      console.warn("DATABASE_URL is configured but the database is unreachable. Falling back to in-memory SQLite for local development.", err);
      initializeSqliteFallback();
      return;
    }
  }

  initializeSqliteFallback();
}

export function getDb() {
  if (!instance) {
    if (env.databaseUrl) {
      instance = createMysqlInstance();
    } else {
      initializeSqliteFallback();
    }
  }
  return instance;
}

export async function checkDbConnection(timeoutMs = 3000): Promise<boolean> {
  if (!env.databaseUrl) {
    // We will use sqlite fallback in dev — treat as healthy
    return true;
  }

  const attempt = async () => {
    const conn = await mysql.createConnection(env.databaseUrl);
    try {
      await conn.query("SELECT 1");
      return true;
    } finally {
      try {
        await conn.end();
      } catch (_) {
        // ignore
      }
    }
  };

  const timer = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DB connection timed out")), timeoutMs));
  return Promise.race([attempt(), timer]) as Promise<boolean>;
}

export function isUsingSqliteFallback() {
  return usingSqliteFallback;
}
