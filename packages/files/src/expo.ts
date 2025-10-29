import { generateReactNativeHelpers } from "@uploadthing/expo";

import type { OurFileRouter } from "./core";

// Note: The URL is passed in your Expo app, not here.
export const { useUploadThing, uploadFiles } =
  generateReactNativeHelpers<OurFileRouter>();
