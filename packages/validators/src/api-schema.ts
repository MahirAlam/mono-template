import z from "zod";

const GetFeedSchema = z.object({
  limit: z.number().min(1).max(50).default(10),
  userId: z.string().optional(),
  feedFor: z.enum(["home", "profile", "explore", "bookmarks"]).default("home"),
  cursor: z.string().optional().nullable(),
});

type GetFeedSchemaType = z.infer<typeof GetFeedSchema>;

export { GetFeedSchema };
export type { GetFeedSchemaType };
