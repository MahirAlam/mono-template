import type { FileRouter } from "uploadthing/server";
import { createUploadthing, UploadThingError } from "uploadthing/server";

import { getSession } from "~/lib/auth/server"; // Import your app-specific session

const f = createUploadthing();

// Define the router using the app's context
const ourFileRouter = {
  avatarUploader: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSession();
      if (!session?.user?.id) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),

  bannerUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSession();
      if (!session?.user) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),

  imageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 4 } })
    .middleware(async () => {
      const session = await getSession();
      if (!session?.user) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),

  videoUploader: f({ video: { maxFileSize: "256MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSession();
      if (!session?.user) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

// Export ONLY the TYPE of the router.
// This is what other parts of your monorepo will import.
export type OurFileRouter = typeof ourFileRouter;

// We export the router object itself for the route handler.
export default ourFileRouter;
