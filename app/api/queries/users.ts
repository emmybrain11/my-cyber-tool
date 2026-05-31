import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser, User } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";
import fs from "fs/promises";
import path from "path";

const DEV_DATA_DIR = path.resolve(process.cwd(), "dev_data");
const DEV_USERS_FILE = path.join(DEV_DATA_DIR, "users.json");

async function readDevUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(DEV_USERS_FILE, "utf-8");
    return JSON.parse(data) as User[];
  } catch (err) {
    return [];
  }
}

async function writeDevUsers(users: User[]) {
  try {
    await fs.mkdir(DEV_DATA_DIR, { recursive: true });
    await fs.writeFile(DEV_USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write dev users file:", err);
  }
}

async function hasDbAvailable() {
  try {
    // quick check: getDb() may throw if not initialized
    getDb();
    return true;
  } catch (err) {
    return false;
  }
}

export async function findUserByUnionId(unionId: string) {
  if (await hasDbAvailable()) {
    const rows = await getDb()
      .select()
      .from(schema.users)
      .where(eq(schema.users.unionId, unionId))
      .limit(1);
    return rows.at(0) as User | undefined;
  }

  const users = await readDevUsers();
  return users.find((u) => u.unionId === unionId) as User | undefined;
}

export async function findUserByEmail(email: string) {
  if (await hasDbAvailable()) {
    try {
      const rows = await getDb()
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1);
      return rows.at(0) as User | undefined;
    } catch (error) {
      console.error("User lookup failed for email:", email, error);
      throw new Error("Database lookup failed. Check DATABASE_URL and database connectivity.");
    }
  }

  const users = await readDevUsers();
  return users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) as User | undefined;
}

export async function findPendingUsers() {
  if (await hasDbAvailable()) {
    return getDb()
      .select()
      .from(schema.users)
      .where(eq(schema.users.approved, 0))
      .orderBy(schema.users.createdAt);
  }

  const users = await readDevUsers();
  return users.filter((u) => u.approved === 0);
}

export async function upsertUser(data: InsertUser) {
  const values = { ...data } as any;
  const updateSet: Partial<InsertUser> = {
    lastSignInAt: new Date(),
    ...data,
  };

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerEmail
  ) {
    values.role = "admin";
    updateSet.role = "admin";
    values.approved = 1 as any;
    updateSet.approved = 1 as any;
  }

  if (await hasDbAvailable()) {
    await getDb()
      .insert(schema.users)
      .values(values)
      .onDuplicateKeyUpdate({ set: updateSet });
    return;
  }

  // Dev fallback: read users file and upsert
  const users = await readDevUsers();
  const idx = users.findIndex((u) => u.unionId === values.unionId || (u.email && u.email.toLowerCase() === (values.email || "").toLowerCase()));
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...values } as User;
  } else {
    // assign a simple incremental id
    const maxId = users.reduce((m, u) => Math.max(m, (u as any).id || 0), 0);
    (values as any).id = maxId + 1;
    users.push(values as User);
  }
  await writeDevUsers(users as User[]);
}
