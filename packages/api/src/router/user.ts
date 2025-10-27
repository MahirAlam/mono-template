import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { ilike, or } from "@tera/db";
import { user } from "@tera/db/schema";

import { publicProcedure } from "../trpc";

export const userRouter = {
  getForMention: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;

      try {
        if (!query || !query.trim()) {
          // Return empty array if no query - don't show all users
          return [];
        }

        const results = await ctx.db
          .select({
            id: user.id,
            name: user.name,
            image: user.image,
          })
          .from(user)
          .where(
            or(
              ilike(user.name, `%${query.trim()}%`),
              ilike(user.email, `%${query.trim()}%`),
            ),
          )
          .limit(limit);

        return results;
      } catch (error) {
        console.error("Error fetching users for mention:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch users",
        });
      }
    }),
} satisfies TRPCRouterRecord;
