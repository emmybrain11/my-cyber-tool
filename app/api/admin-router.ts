import { z } from "zod";
import { adminQuery, createRouter } from "./middleware";
import { findPendingUsers, findUserByEmail, upsertUser } from "./queries/users";
import { and, eq } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";

export const adminRouter = createRouter({
  pendingUsers: adminQuery.query(async () => {
    return await findPendingUsers();
  }),

  approveUser: adminQuery
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await findUserByEmail(input.email);
      if (!user) {
        throw new Error("User not found.");
      }

      const adminUsers = await getDb()
        .select()
        .from(users)
        .where(and(eq(users.role, "admin"), eq(users.approved, 1 as any)));

      const shouldGrantAdmin = user.role === "admin" || adminUsers.length < 4;
      await upsertUser({
        ...user,
        approved: 1 as any,
        role: shouldGrantAdmin ? "admin" : "user",
      });
      return { success: true, role: shouldGrantAdmin ? "admin" : "user" };
    }),

  rejectUser: adminQuery
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await findUserByEmail(input.email);
      if (!user) {
        throw new Error("User not found.");
      }
      await getDb()
        .delete(users)
        .where(eq(users.email, input.email));
      return { success: true };
    }),

  allUsers: adminQuery.query(async () => {
    return getDb().select().from(users).orderBy(users.createdAt);
  }),
});
