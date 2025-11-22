import { createRouteHandler } from "uploadthing/next";

import ourFileRouter from "~/lib/uploadthing";

// Export routes for Next App Router, using the fully configured router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
