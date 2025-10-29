import type { FileRouter } from "uploadthing/server";
import { createUploadthing, UploadThingError } from "uploadthing/server";

// import { getSession } from "@tera/auth"; // TODO: Adjust this to your auth package

const f = createUploadthing();

export const ourFileRouter = {
  // A basic image uploader
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // TODO: Replace with your actual session logic
      // const session = await getSession(req);
      const session = { user: { id: "fake-user-id" } }; // Placeholder

      if (!session?.user) throw new UploadThingError("Unauthorized");

      // Pass metadata to onUploadComplete
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      // You can return data to the client here
      return { uploadedBy: metadata.userId };
    }),

  // An endpoint for video posts
  videoPost: f({
    video: { maxFileSize: "256MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      // const session = await getSession(req);
      const session = { user: { id: "fake-user-id" } }; // Placeholder
      if (!session?.user) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`Video post upload complete for ${metadata.userId}`);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
