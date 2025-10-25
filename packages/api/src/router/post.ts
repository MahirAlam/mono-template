import type { TRPCRouterRecord } from "@trpc/server";

import { publicProcedure } from "../trpc";

export const postRouter = {
  all: publicProcedure.query(() => {
    return { success: true };
  }),
} satisfies TRPCRouterRecord;
