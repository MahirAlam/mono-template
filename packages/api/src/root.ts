import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  post: postRouter,
  // user: userRouter,
  // feed: feedRouter,
  // story: storyRouter,
  // notification: notificationRouter,
  // messenger: messengerRouter,
  // upload: uploadRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
