import { UTApi } from "uploadthing/server";

/**
 * A shared, server-side client for the UploadThing API.
 * This automatically uses the UPLOADTHING_SECRET from your environment.
 */
export const utapi = new UTApi();
