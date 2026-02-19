import { z } from "zod";

// route層で受け取るJSONのバリデーション定義。
export const registerFeedSchema = z.object({
  url: z.string().url(),
  folderId: z.string().uuid().nullable().optional(),
});

export type RegisterFeedBody = z.infer<typeof registerFeedSchema>;
