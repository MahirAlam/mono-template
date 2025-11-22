// User Interactions Schema - Muting System

import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";

import { createTable } from "./createTable";
import { userTable } from "./users";

export const userMuteTable = createTable(
  "user_mute",
  (t) => ({
    // The user performing the mute
    sourceUserId: t
      .text("source_user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    // The user being muted
    targetUserId: t
      .text("target_user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.sourceUserId, t.targetUserId] })],
);

export const userMuteRelations = relations(userMuteTable, ({ one }) => ({
  sourceUser: one(userTable, {
    fields: [userMuteTable.sourceUserId],
    references: [userTable.id],
    relationName: "mute_source",
  }),
  targetUser: one(userTable, {
    fields: [userMuteTable.targetUserId],
    references: [userTable.id],
    relationName: "mute_target",
  }),
}));
