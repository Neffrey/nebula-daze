// LIBS
import { eq } from "drizzle-orm";
import "server-only"; // Make sure you can't import this on client

// UTILS
import { basicUserProcedure, createTRPCRouter } from "~/server/api/trpc";
import { users } from "~/server/db/schema";

export const productRouter = createTRPCRouter({
  get: basicUserProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });
  }),
});
