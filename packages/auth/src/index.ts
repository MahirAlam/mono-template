// F:\tera-tok\packages\auth\src\index.ts

// Import the crypto module for generating unique filenames
import { randomUUID } from "crypto";
import type { BetterAuthOptions } from "better-auth";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { oAuthProxy, username } from "better-auth/plugins";

import { db } from "@tera/db/client";
import {
  accountTable,
  sessionTable,
  userTable,
  verificationTable,
} from "@tera/db/schema";
import { uploadAvatarFromUrl } from "@tera/utils";

export function initAuth(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  discordClientId: string;
  discordClientSecret: string;

  githubClientId: string;
  githubClientSecret: string;

  googleClientId: string;
  googleClientSecret: string;
}) {
  const config = {
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: userTable,
        session: sessionTable,
        account: accountTable,
        verification: verificationTable,
      },
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
      // eslint-disable-next-line @typescript-eslint/require-await
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") {
          return;
        }

        const body = ctx.body as Record<string, unknown> | undefined;
        const email = body?.email as string | undefined;
        if (!email) {
          throw new APIError("BAD_REQUEST", {
            message: "Email is required",
          });
        }

        if (!email.endsWith("@gmail.com")) {
          throw new APIError("BAD_REQUEST", {
            message: "Email must end with @gmail.com",
          });
        }
      }),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (userData) => {
            const image = userData.image as string | undefined;

            // 1. Check if an external image URL is present
            // We'll use "utfs.io" as the domain for UploadThing files.
            if (
              image &&
              (!image.includes("utfs.io/f/") ||
                !image.includes(".ufs.sh/f/")) &&
              (image.startsWith("http") || image.startsWith("https"))
            ) {
              // 2. Use a try...catch block to handle potential runtime errors
              try {
                const uploadedImageData = await uploadAvatarFromUrl(
                  image,
                  { width: 256, height: 256, quality: 80 }, // Optimize for avatars
                  `avatar-${userData.id ? userData.id : randomUUID()}.jpg`, // Create a unique filename
                );

                // 3. Return the structured success response
                return {
                  data: { ...userData, image: uploadedImageData.ufsUrl },
                };
              } catch (error) {
                // 4. Catch any error thrown by uploadImageFromUrl
                console.error("Upload Action Failed:", error);

                throw new Error("Failed to upload avatar image.");
              }
            }

            // 4. Return the (potentially modified) user data
            return { data: userData };
          },
        },
      },
    },
    socialProviders: {
      discord: {
        clientId: options.discordClientId,
        clientSecret: options.discordClientSecret,
        redirectURI: `${options.baseUrl}/api/auth/callback/discord`,
      },
      google: {
        clientId: options.githubClientId,
        clientSecret: options.googleClientSecret,
        redirectURI: `${options.baseUrl}/api/auth/callback/google`,
      },
      github: {
        clientId: options.githubClientId,
        clientSecret: options.githubClientSecret,
        redirectURI: `${options.baseUrl}/api/auth/callback/github`,
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
