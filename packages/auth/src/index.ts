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
