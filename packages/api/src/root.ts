import { hashtagRouter } from "./router/hashtag";
import { postRouter } from "./router/post";
import { userRouter } from "./router/user";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  post: postRouter,
  user: userRouter,
  hashtag: hashtagRouter,
  // feed: feedRouter,
  // story: storyRouter,
  // notification: notificationRouter,
  // messenger: messengerRouter,
  // upload: uploadRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
