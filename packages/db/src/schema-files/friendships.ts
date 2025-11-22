// src/server/db/schema/friendships.ts

import { pgEnum, primaryKey } from "drizzle-orm/pg-core";

import { createTable } from "./createTable";
import { userTable } from "./users";

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "accepted",
  "blocked",
]);

export const friendshipTable = createTable(
  "friendship",
  (t) => ({
    // Enforce order: user_id_one will always be the smaller ID lexicographically
    userId: t
      .text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    friendId: t
      .text("friend_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    status: friendshipStatusEnum("status").notNull(),
    // Tracks who performed the last action (e.g., sent the request, blocked the user)
    actionUserId: t.text("action_user_id").notNull(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.friendId] })],
);

/**
 * Close friends table: stores explicit close-friend relationships and optional labels/types
 */
export const closeFriendshipTable = createTable(
  "close_friendship",
  (t) => ({
    userId: t
      .text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    friendId: t
      .text("friend_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    label: t.text("label"), // optional user-defined label or type
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.friendId] })],
);
