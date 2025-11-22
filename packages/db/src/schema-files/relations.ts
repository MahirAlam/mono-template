// Schema Relations

import { relations } from "drizzle-orm";

import { closeFriendshipTable, friendshipTable } from "./friendships";
import {
  commentReactionTable,
  commentTable,
  hashtagTable,
  linkPreviewTable,
  postHashtagTable,
  postMediaTable,
  postReactionTable,
  postTable,
  postUserTagTable,
  postVisibilityTable,
  reactionTable,
} from "./posts";
import { profileTable, userProfileLinkTable } from "./profile";
import { accountTable, sessionTable, userTable } from "./users";

// ---- User Relations ----
export const userRelations = relations(userTable, ({ one, many }) => ({
  sessions: many(sessionTable),
  accounts: many(accountTable),
  posts: many(postTable),
  comments: many(commentTable),
  postReactions: many(postReactionTable),
  commentReactions: many(commentReactionTable),
  taggedInPosts: many(postUserTagTable),
  profile: one(profileTable, {
    fields: [userTable.id],
    references: [profileTable.userId],
  }),
  links: many(userProfileLinkTable),
}));

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));

export const accountRelations = relations(accountTable, ({ one }) => ({
  user: one(userTable, {
    fields: [accountTable.userId],
    references: [userTable.id],
  }),
}));

export const friendshipRelations = relations(friendshipTable, ({ one }) => ({
  userOne: one(userTable, {
    fields: [friendshipTable.userId],
    references: [userTable.id],
    relationName: "user_id",
  }),
  userTwo: one(userTable, {
    fields: [friendshipTable.friendId],
    references: [userTable.id],
    relationName: "friend_id",
  }),
}));

export const closeFriendshipRelations = relations(
  closeFriendshipTable,
  ({ one }) => ({
    userOne: one(userTable, {
      fields: [closeFriendshipTable.userId],
      references: [userTable.id],
      relationName: "user_id",
    }),
    userTwo: one(userTable, {
      fields: [closeFriendshipTable.friendId],
      references: [userTable.id],
      relationName: "friend_id",
    }),
  }),
);

export const profileRelations = relations(profileTable, ({ one }) => ({
  user: one(userTable, {
    fields: [profileTable.userId],
    references: [userTable.id],
  }),
}));

export const userProfileLinkRelations = relations(
  userProfileLinkTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [userProfileLinkTable.userId],
      references: [userTable.id],
    }),
  }),
);

// ---- Post Relations ----
export const postRelations = relations(postTable, ({ one, many }) => ({
  author: one(userTable, {
    fields: [postTable.authorId],
    references: [userTable.id],
  }),
  visibility: one(postVisibilityTable, {
    fields: [postTable.visibilityId],
    references: [postVisibilityTable.id],
  }),
  comments: many(commentTable),
  reactions: many(postReactionTable),
  media: many(postMediaTable),
  taggedUsers: many(postUserTagTable),
  linkPreview: one(linkPreviewTable),
  hashtags: many(postHashtagTable),
  originalPost: one(postTable, {
    fields: [postTable.sharedPostId],
    references: [postTable.id],
    relationName: "originalPost",
  }),
  shares: many(postTable, { relationName: "originalPost" }),
}));

export const postReactionRelations = relations(
  postReactionTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [postReactionTable.userId],
      references: [userTable.id],
    }),
    post: one(postTable, {
      fields: [postReactionTable.postId],
      references: [postTable.id],
    }),
    reaction: one(reactionTable, {
      fields: [postReactionTable.reactionId],
      references: [reactionTable.id],
    }),
  }),
);

export const commentReactionRelations = relations(
  commentReactionTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [commentReactionTable.userId],
      references: [userTable.id],
    }),
    comment: one(commentTable, {
      fields: [commentReactionTable.commentId],
      references: [commentTable.id],
    }),
    reaction: one(reactionTable, {
      fields: [commentReactionTable.reactionId],
      references: [reactionTable.id],
    }),
  }),
);

export const commentRelations = relations(commentTable, ({ one, many }) => ({
  author: one(userTable, {
    fields: [commentTable.authorId],
    references: [userTable.id],
  }),
  post: one(postTable, {
    fields: [commentTable.postId],
    references: [postTable.id],
  }),
  reactions: many(commentReactionTable),
  parent: one(commentTable, {
    fields: [commentTable.parentId],
    references: [commentTable.id],
    relationName: "replies",
  }),
  replies: many(commentTable, {
    relationName: "replies",
  }),
}));

export const postHashtagRelations = relations(postHashtagTable, ({ one }) => ({
  post: one(postTable, {
    fields: [postHashtagTable.postId],
    references: [postTable.id],
  }),
  hashtag: one(hashtagTable, {
    fields: [postHashtagTable.hashtagId],
    references: [hashtagTable.id],
  }),
}));

export const postMediaRelations = relations(postMediaTable, ({ one }) => ({
  post: one(postTable, {
    fields: [postMediaTable.postId],
    references: [postTable.id],
  }),
}));

export const linkPreviewRelations = relations(linkPreviewTable, ({ one }) => ({
  post: one(postTable, {
    fields: [linkPreviewTable.postId],
    references: [postTable.id],
  }),
}));

export const postUserTagRelations = relations(postUserTagTable, ({ one }) => ({
  post: one(postTable, {
    fields: [postUserTagTable.postId],
    references: [postTable.id],
  }),
  user: one(userTable, {
    fields: [postUserTagTable.userId],
    references: [userTable.id],
  }),
}));
