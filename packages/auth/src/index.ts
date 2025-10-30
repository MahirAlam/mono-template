// F:\tera-tok\packages\auth\src\index.ts

// Import the crypto module for generating unique filenames
import { randomUUID } from "crypto";
import type { BetterAuthOptions } from "better-auth";
import { expo } from "@better-auth/expo";
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  createAuthMiddleware,
  oAuthProxy,
  username,
} from "better-auth/plugins";

import { db } from "@tera/db/client";
import { uploadImageFromUrl } from "@tera/utils";

export function initAuth(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  discordClientId: string;
  discordClientSecret: string;
}) {
  const config = {
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
    plugins: [
      username({}),
      oAuthProxy({
        productionURL: options.productionUrl,
      }),
      expo(),
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") {
          return;
        }
        if (!ctx.body?.email.endsWith("@example.com")) {
          throw new APIError("BAD_REQUEST", {
            message: "Email must end with @example.com",
          });
        }
      }),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (userData) => {
            // 1. Check if an external image URL is present
            // We'll use "utfs.io" as the domain for UploadThing files.
            if (userData.image && !userData.image.includes("utfs.io")) {
              try {
                console.log(`Processing external avatar: ${userData.image}`);

                // 2. Process and upload the image
                const uploadedImageData = await uploadImageFromUrl(
                  userData.image,
                  { width: 256, height: 256, quality: 80 }, // Optimize for avatars
                  `avatar_${randomUUID()}.webp`, // Create a unique filename
                );

                // 3. If successful, update the image URL
                if (uploadedImageData?.url) {
                  console.log(
                    `Avatar uploaded. New URL: ${uploadedImageData.url}`,
                  );
                  userData.image = uploadedImageData.url;
                }
              } catch (error) {
                // If image processing fails, we don't want to block user creation.
                // We log the error and proceed with the original avatar URL.
                console.error("Failed to process and upload avatar:", error);
              }
            }

            // 4. Return the (potentially modified) user data
            return { data: userData };
          },
        },
      },
    },
    // --- END NEW SECTION ---
    user: {
      fields: {
        name: "fullName",
      },
    },
    socialProviders: {
      discord: {
        clientId: options.discordClientId,
        clientSecret: options.discordClientSecret,
        redirectURI: `${options.baseUrl}/api/auth/callback/discord`,
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: ["expo://"],
    onAPIError: {
      onError(error, ctx) {
        console.error("BETTER AUTH API ERROR", error, ctx);
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
