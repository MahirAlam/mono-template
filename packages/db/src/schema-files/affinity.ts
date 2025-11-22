// src/server/db/schema/affinity.ts
import { primaryKey } from "drizzle-orm/pg-core";

import { createTable } from "./createTable";
import { hashtagTable } from "./posts";
import { userTable } from "./users";

export const userHashtagAffinityTable = createTable(
  "user_hashtag_affinity",
  (t) => ({
    userId: t
      .text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    hashtagId: t
      .text("hashtag_id")
      .notNull()
      .references(() => hashtagTable.id, { onDelete: "cascade" }),
    score: t.integer("score").default(0).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.hashtagId] })],
);

export const userAffinityTable = createTable(
  "user_affinity",
  (t) => ({
    sourceUserId: t
      .text("source_user_id")
      .notNull()
      .references(() => userTable.id), // The viewer
    targetUserId: t
      .text("target_user_id")
      .notNull()
      .references(() => userTable.id), // The post author
    score: t.integer("score").default(0).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.sourceUserId, t.targetUserId] })],
);
