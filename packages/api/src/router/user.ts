// packages\api\src\router\user.ts

import { randomUUID } from "crypto";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { UploadData } from "@tera/utils/types";
import { ilike, or } from "@tera/db";
import { userTable } from "@tera/db/schema";
import { uploadAvatarFromUrl } from "@tera/utils";

import { publicProcedure } from "../trpc";

/**
 * Define a structured return type for our server action.
 * This makes it easy for the client to handle success and error states.
 */
type ActionResult =
  | { success: true; data: UploadData }
  | { success: false; error: string };

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
        if (!query?.trim()) {
          // Return empty array if no query - don't show all users
          return [];
        }

        const results = await ctx.db
          .select({
            id: userTable.id,
            name: userTable.name,
            image: userTable.image,
          })
          .from(userTable)
          .where(
            or(
              ilike(userTable.name, `%${query.trim()}%`),
              ilike(userTable.email, `%${query.trim()}%`),
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
  uploadUserAvatar: publicProcedure
    .input(
      z.object({
        url: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { url } = input;
      const userId = ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to upload an avatar.",
        });
      }

      // 1. Basic validation
      if (!url.startsWith("http")) {
        return { success: false, error: "A valid URL is required." };
      }

      // 2. Use a try...catch block to handle potential runtime errors
      try {
        const uploadedImageData = await uploadAvatarFromUrl(
          url,
          { width: 256, height: 256, quality: 80 }, // Optimize for avatars
          `avatar-${randomUUID()}.webp`, // Create a unique filename
        );

        console.log("Upload successful:", uploadedImageData);

        // 3. Return the structured success response
        return { success: true, data: uploadedImageData } as ActionResult;
      } catch (error) {
        // 4. Catch any error thrown by uploadImageFromUrl
        console.error("Upload Action Failed:", error);

        // 5. Return a structured error response (avoid exposing detailed errors to the client)
        return { success: false, error: "Failed to process the image." };
      }
    }),
} satisfies TRPCRouterRecord;
