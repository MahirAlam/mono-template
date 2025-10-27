// Posts Schema

import type { JSONContent } from "@tiptap/react";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { index, pgTable, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { v4 as uuid } from "uuid";

import { user } from "./user";

/**
 * SCALABLE: Post Visibility Table
 * Why?: Instead of an enum, a table lets you add new visibility rules
 * (e.g., "Friends except...", "Custom List") without changing your DB schema.
 * You can also add descriptions that can be shown in the UI.
 */
export const postVisibility = pgTable("post_visibility", (t) => ({
  id: t
    .text("id")
    .primaryKey()
    .$defaultFn(() => uuid()),
  name: t.text("name").notNull().unique(), // e.g., 'public', 'friends', 'private'
  description: t.text("description"), // e.g., 'Visible to everyone on and off the platform'
  filter: t.text("filter").notNull(),
}));

/**
 * SCALABLE: Reaction Type Table
 * Why?: An enum locks you in. A table lets you add 100+ reactions dynamically.
 * You can store different metadata for each reaction, like the name for accessibility
 * and a code/URL for the image/animation to display.
 */
export const reaction = pgTable(
  "reaction",
  (t) => ({
    id: t
      .text("id")
      .primaryKey()
      .$defaultFn(() => uuid()),
    name: t.text("name").notNull(),
    displayCode: t.text("display_code").notNull().unique(),
  }),
  (t) => [uniqueIndex("reaction_name_idx").on(t.name)],
);

/**
 * Hashtags Table
 * Stores a central, unique list of all hashtags used.
 */
export const hashtag = pgTable(
  "hashtag",
  (t) => ({
    id: t
      .text("id")
      .primaryKey()
      .$defaultFn(() => uuid()),
    tag: t.text("tag").notNull().unique(),
    usageCount: t.integer("usage_count").notNull().default(0),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
  }),
  (t) => [
    uniqueIndex("hashtag_tag_idx").on(t.tag),
    index("hashtag_usage_count_idx").on(t.usageCount), // For popular hashtag queries
  ],
);

// ---- Core Post System ----
export const post = pgTable(
  "post",
  (t) => ({
    id: t
      .text("id")
      .primaryKey()
      .$defaultFn(() => uuid()),
    content: t.jsonb("content").$type<JSONContent>(),
    authorId: t
      .text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Foreign key to the new visibility table
    visibilityId: t
      .text("visibility_id")
      .notNull()
      .references(() => postVisibility.id, { onDelete: "restrict" }),
    sharedPostId: t
      .text("shared_postId")
      .references((): AnyPgColumn => post.id, { onDelete: "cascade" }),
    createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: t.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("post_author_id_idx").on(t.authorId),
    index("post_visibility_id_idx").on(t.visibilityId),
    index("post_created_at_idx").on(t.createdAt), // Crucial for sorting feeds
  ],
);

/**
 * Join Table for Posts and Hashtags (Many-to-Many)
 */
export const postHashtag = pgTable(
  "post_hashtag",
  (t) => ({
    postId: t
      .text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    hashtagId: t
      .text("hashtag_id")
      .notNull()
      .references(() => hashtag.id, { onDelete: "cascade" }),
  }),
  (t) => [
    primaryKey({ columns: [t.postId, t.hashtagId] }),
    // Indexing the hashtagId allows finding all posts with a specific tag quickly
    index("post_hashtag_hashtag_id_idx").on(t.hashtagId),
  ],
);

/**
 * Reactions on Posts
 */
export const postReaction = pgTable(
  "post_reaction",
  (t) => ({
    userId: t
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: t
      .text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    // Foreign key to the new reaction table
    reactionId: t
      .text("reaction_id")
      .notNull()
      .references(() => reaction.id, { onDelete: "cascade" }),
    createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => [
    primaryKey({ columns: [t.userId, t.postId] }),
    index("post_reaction_postId_idx").on(t.postId), // Indexing postId allows for fast counting of reactions on a post
  ],
);

export const postUserTag = pgTable(
  "post_user_tag",
  (t) => ({
    postId: t
      .text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  }),
  (t) => [
    primaryKey({ columns: [t.postId, t.userId] }),
    index("post_user_tag_user_id_idx").on(t.userId), // For finding all posts mentioning a user
  ],
);

/**
 * Stores media items (images, videos) associated with a post.
 */
export const postMedia = pgTable(
  "post_media",
  (t) => ({
    id: t
      .text("id")
      .primaryKey()
      .$defaultFn(() => uuid()),
    postId: t
      .text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    url: t.text("url").notNull(),
    type: t.text("type").notNull(), // 'image' or 'video'
    altText: t.text("alt_text"),
    order: t.integer("order").default(0).notNull(),
  }),
  (t) => [index("media_postId_idx").on(t.postId)],
);

/**
 * Stores scraped metadata for URLs shared in posts.
 */
export const linkPreview = pgTable("link_preview", (t) => ({
  id: t
    .text("id")
    .primaryKey()
    .$defaultFn(() => uuid()),
  postId: t
    .text("postId")
    .notNull()
    .references(() => post.id, { onDelete: "cascade" })
    .unique(),
  url: t.text("url").notNull(),
  title: t.text("title"),
  description: t.text("description"),
  imageUrl: t.text("image_url"),
  position: t
    .text("position")
    .notNull()
    .default("last")
    .$type<"first" | "last">(), // "first" or "last"
}));

/**
 * Comments on posts, with support for threaded replies.
 */
export const comment = pgTable(
  "comment",
  (t) => ({
    id: t
      .text("id")
      .primaryKey()
      .$defaultFn(() => uuid()),
    content: t.jsonb("content").$type<JSONContent>(),
    authorId: t
      .text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postId: t
      .text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    parentId: t
      .text("parent_id")
      .references((): AnyPgColumn => comment.id, { onDelete: "cascade" }),
    createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: t.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("comment_author_id_idx").on(t.authorId),
    index("comment_postId_idx").on(t.postId),
    index("comment_parent_id_idx").on(t.parentId),
  ],
);

export const commentReaction = pgTable(
  "comment_reaction",
  (t) => ({
    userId: t
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    commentId: t
      .text("comment_id")
      .notNull()
      .references(() => comment.id, { onDelete: "cascade" }),
    reactionId: t
      .text("reaction_id")
      .notNull()
      .references(() => reaction.id, { onDelete: "cascade" }),
    createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => [
    primaryKey({ columns: [t.userId, t.commentId] }),
    index("comment_reaction_comment_id_idx").on(t.commentId),
  ],
);
