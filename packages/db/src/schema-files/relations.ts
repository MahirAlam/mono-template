// Schema Relations

import { relations } from "drizzle-orm";

import {
  comment,
  commentReaction,
  hashtag,
  linkPreview,
  post,
  postHashtag,
  postMedia,
  postReaction,
  postUserTag,
  postVisibility,
  reaction,
} from "./post";
import { account, session, user } from "./user";

// ---- User Relations ----

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  posts: many(post),
  comments: many(comment),
  postReactions: many(postReaction),
  commentReactions: many(commentReaction),
  taggedInPosts: many(postUserTag),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

// ---- Post Relations ----

export const postRelations = relations(post, ({ one, many }) => ({
  author: one(user, { fields: [post.authorId], references: [user.id] }),
  visibility: one(postVisibility, {
    fields: [post.visibilityId],
    references: [postVisibility.id],
  }),
  comments: many(comment),
  reactions: many(postReaction),
  media: many(postMedia),
  taggedUsers: many(postUserTag),
  linkPreview: one(linkPreview),
  hashtags: many(postHashtag),
  originalPost: one(post, {
    fields: [post.sharedPostId],
    references: [post.id],
    relationName: "originalPost",
  }),
  shares: many(post, { relationName: "originalPost" }),
}));

export const postReactionRelations = relations(postReaction, ({ one }) => ({
  user: one(user, { fields: [postReaction.userId], references: [user.id] }),
  post: one(post, { fields: [postReaction.postId], references: [post.id] }),
  reaction: one(reaction, {
    fields: [postReaction.reactionId],
    references: [reaction.id],
  }),
}));

export const commentReactionRelations = relations(
  commentReaction,
  ({ one }) => ({
    user: one(user, {
      fields: [commentReaction.userId],
      references: [user.id],
    }),
    comment: one(comment, {
      fields: [commentReaction.commentId],
      references: [comment.id],
    }),
    reaction: one(reaction, {
      fields: [commentReaction.reactionId],
      references: [reaction.id],
    }),
  }),
);

export const commentRelations = relations(comment, ({ one, many }) => ({
  author: one(user, { fields: [comment.authorId], references: [user.id] }),
  post: one(post, { fields: [comment.postId], references: [post.id] }),
  reactions: many(commentReaction),
  parent: one(comment, {
    fields: [comment.parentId],
    references: [comment.id],
    relationName: "replies",
  }),
  replies: many(comment, {
    relationName: "replies",
  }),
}));

export const postHashtagRelations = relations(postHashtag, ({ one }) => ({
  post: one(post, { fields: [postHashtag.postId], references: [post.id] }),
  hashtag: one(hashtag, {
    fields: [postHashtag.hashtagId],
    references: [hashtag.id],
  }),
}));

export const postMediaRelations = relations(postMedia, ({ one }) => ({
  post: one(post, { fields: [postMedia.postId], references: [post.id] }),
}));

export const linkPreviewRelations = relations(linkPreview, ({ one }) => ({
  post: one(post, { fields: [linkPreview.postId], references: [post.id] }),
}));

export const postUserTagRelations = relations(postUserTag, ({ one }) => ({
  post: one(post, { fields: [postUserTag.postId], references: [post.id] }),
  user: one(user, { fields: [postUserTag.userId], references: [user.id] }),
}));
