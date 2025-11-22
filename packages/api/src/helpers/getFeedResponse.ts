import console from "console";
import { TRPCError } from "@trpc/server";

import { algorithm } from "@tera/utils";
import { GetFeedSchemaType } from "@tera/validators";

type GetFeedResponseParams = GetFeedSchemaType & {
  userUpdatedAt: Date;
};

export async function getFeedResponse({
  feedFor,
  userId,
  limit,
  cursor,
  userUpdatedAt,
}: GetFeedResponseParams) {
  if (!userId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "userId is required to fetch feed",
    });
  }

  try {
    if (feedFor === "home") {
      // For profile feeds, we might want different logic in the future
      // For now, use the same algorithm for both feed and profile
      const feed = await algorithm.getRankedFeed({
        userId: userId,
        userUpdatedAt,
        limit,
        cursor: cursor || undefined,
      });

      return feed;
    }
  } catch (error) {
    console.error("Error fetching feed:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch feed",
    });
  }
}
