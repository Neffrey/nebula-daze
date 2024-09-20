// LIBS
import { and, eq } from "drizzle-orm";
import "server-only"; // Make sure you can't import this on client
import { z } from "zod";

// UTILS
import { basicUserProcedure, createTRPCRouter } from "~/server/api/trpc";
import { profilePictures } from "~/server/db/schema";

export const profilePictureRouter = createTRPCRouter({
  getProfilePictures: basicUserProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.profilePictures.findMany({
      where: eq(profilePictures.user, ctx.session.user.id),
    });
  }),
  create: basicUserProcedure
    .input(
      z.object({
        url: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.insert(profilePictures).values({
        user: ctx.session.user.id,
        url: input.url,
      });
    }),
  delete: basicUserProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(profilePictures)
        .where(
          and(
            eq(profilePictures.id, input.id),
            eq(profilePictures.user, ctx.session.user.id),
          ),
        );
    }),
});
