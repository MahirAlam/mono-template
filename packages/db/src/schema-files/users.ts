// Users Schema

import { index } from "drizzle-orm/pg-core";

import { createTable } from "./createTable";

export const userTable = createTable(
  "user",
  (t) => ({
    id: t.text("id").primaryKey(),
    name: t.text("name").notNull(),
    email: t.text("email").notNull().unique(),
    emailVerified: t.boolean("email_verified").default(false).notNull(),
    image: t.text("image"),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    username: t.text("username").unique(),
    displayUsername: t.text("display_username"),
  }),
  (t) => [
    index("users_email_idx").on(t.email),
    index("users_name_idx").on(t.name),
    index("users_id_idx").on(t.id),
  ],
);

export const sessionTable = createTable(
  "session",
  (t) => ({
    id: t.text("id").primaryKey(),
    expiresAt: t.timestamp("expires_at").notNull(),
    token: t.text("token").notNull().unique(),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t
      .timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: t.text("ip_address"),
    userAgent: t.text("user_agent"),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
  }),
  (t) => [
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_token_idx").on(t.token),
  ],
);

export const accountTable = createTable(
  "account",
  (t) => ({
    id: t.text("id").primaryKey(),
    accountId: t.text("account_id").notNull(),
    providerId: t.text("provider_id").notNull(),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    accessToken: t.text("access_token"),
    refreshToken: t.text("refresh_token"),
    idToken: t.text("id_token"),
    accessTokenExpiresAt: t.timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: t.timestamp("refresh_token_expires_at"),
    scope: t.text("scope"),
    password: t.text("password"),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t
      .timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const verificationTable = createTable(
  "verification",
  (t) => ({
    id: t.text("id").primaryKey(),
    identifier: t.text("identifier").notNull(),
    value: t.text("value").notNull(),
    expiresAt: t.timestamp("expires_at").notNull(),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);
