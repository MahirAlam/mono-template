// Profile Schema

import { index } from "drizzle-orm/pg-core";
import { v4 as uuid } from "uuid";

import { createTable } from "./createTable";
import { userTable } from "./users";

/**
 * User Profile Table
 * Stores extended profile information separate from core user data
 * for better normalization and performance
 */
export const profileTable = createTable(
  "profile",
  (t) => ({
    userId: t
      .text("user_id")
      .primaryKey()
      .references(() => userTable.id, { onDelete: "cascade" }),
    bannerImage: t.text("banner_image"),
    bio: t.text("bio"),
    pronouns: t.text("pronouns"),
    nickname: t.text("nickname"),
    location: t.text("location"),
    // Array of post IDs that the user has pinned to their profile
    pinnedPostIds: t.text("pinned_post_ids").array().default([]),
    editedAt: t
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }),
  (t) => [index("profile_user_id_idx").on(t.userId)],
);

/**
 * User Profile Links Table
 * Stores social media links and external URLs for user profiles
 * Supports multiple links per user with different types
 */
export const userProfileLinkTable = createTable(
  "user_profile_link",
  (t) => ({
    id: t
      .text("id")
      .primaryKey()
      .$defaultFn(() => uuid()),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    type: t.text("type").notNull(), // e.g., 'github', 'linkedin', 'website', 'twitter'
    url: t.text("url").notNull(),
    displayText: t.text("display_text"), // Optional custom display text
    order: t.integer("order").default(0).notNull(), // For ordering links in UI
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
  }),
  (t) => [
    index("user_profile_link_user_id_idx").on(t.userId),
    index("user_profile_link_type_idx").on(t.type),
  ],
);
