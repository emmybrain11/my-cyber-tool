import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  json,
  int,
  decimal,
  bigint,
  tinyint,
} from "drizzle-orm/mysql-core";

// ─── Users (Auth) ───────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash"),
  approved: tinyint("approved", { unsigned: true }).default(0).notNull(),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Scan Results ───────────────────────────────────────────
export const scanResults = mysqlTable("scan_results", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  module: varchar("module", { length: 50 }).notNull(),
  target: varchar("target", { length: 255 }),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending"),
  findings: json("findings"),
  summary: text("summary"),
  duration: int("duration"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ScanResult = typeof scanResults.$inferSelect;
export type InsertScanResult = typeof scanResults.$inferInsert;

// ─── Cyber Range Logs ───────────────────────────────────────
export const cyberRangeLogs = mysqlTable("cyber_range_logs", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  scenario: varchar("scenario", { length: 100 }).notNull(),
  action: mysqlEnum("action", ["started", "completed", "failed", "checkpoint"]).notNull(),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type CyberRangeLog = typeof cyberRangeLogs.$inferSelect;
export type InsertCyberRangeLog = typeof cyberRangeLogs.$inferInsert;

// ─── Defense Activity ───────────────────────────────────────
export const defenseActivity = mysqlTable("defense_activity", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  eventType: mysqlEnum("eventType", ["block", "alert", "quarantine", "mitigate", "monitor"]).notNull(),
  description: text("description").notNull(),
  source: varchar("source", { length: 255 }),
  target: varchar("target", { length: 255 }),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
  mitreTechnique: varchar("mitreTechnique", { length: 20 }),
  status: mysqlEnum("status", ["active", "resolved", "false_positive"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type DefenseEvent = typeof defenseActivity.$inferSelect;
export type InsertDefenseEvent = typeof defenseActivity.$inferInsert;

// ─── System Health ──────────────────────────────────────────
export const systemHealth = mysqlTable("system_health", {
  id: serial("id").primaryKey(),
  metric: varchar("metric", { length: 50 }).notNull(),
  value: decimal("value", { precision: 5, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["healthy", "degraded", "critical"]).default("healthy"),
  recordedAt: timestamp("recordedAt").defaultNow(),
});

export type SystemHealth = typeof systemHealth.$inferSelect;
export type InsertSystemHealth = typeof systemHealth.$inferInsert;

// ─── Reports ────────────────────────────────────────────────
export const reports = mysqlTable("reports", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  moduleFilter: varchar("moduleFilter", { length: 50 }),
  dateFrom: timestamp("dateFrom"),
  dateTo: timestamp("dateTo"),
  scanCount: int("scanCount").default(0),
  logCount: int("logCount").default(0),
  defenseCount: int("defenseCount").default(0),
  fileUrl: varchar("fileUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
