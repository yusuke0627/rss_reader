import { z } from "zod";

export const registerFeedSchema = z.object({
  url: z.string().url(),
  folderId: z.string().uuid().nullable().optional(),
});

export type RegisterFeedBody = z.infer<typeof registerFeedSchema>;
