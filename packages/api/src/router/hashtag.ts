import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { desc, ilike } from "@tera/db";
import { hashtagTable } from "@tera/db/schema";

import { publicProcedure } from "../trpc";

export const hashtagRouter = {
  getPopular: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;

      try {
        let results;

        if (query && query.trim()) {
          // Use case-insensitive search with proper indexing
          results = await ctx.db
            .select({
              id: hashtagTable.id,
              tag: hashtagTable.tag,
              usageCount: hashtagTable.usageCount,
            })
            .from(hashtagTable)
            .where(ilike(hashtagTable.tag, `%${query.trim()}%`))
            .orderBy(desc(hashtagTable.usageCount))
            .limit(limit);
        } else {
          // Get most popular hashtags
          results = await ctx.db
            .select({
              id: hashtagTable.id,
              tag: hashtagTable.tag,
              usageCount: hashtagTable.usageCount,
            })
            .from(hashtagTable)
            .orderBy(desc(hashtagTable.usageCount))
            .limit(limit);
        }

        return results;
      } catch (error) {
        console.error("Error fetching hashtags:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch hashtags",
        });
      }
    }),
} satisfies TRPCRouterRecord;
