import { z } from "zod";

// route層で受け取るJSONのバリデーション定義。
export const registerFeedSchema = z.object({
  url: z.string().url(),
});

export type RegisterFeedBody = z.infer<typeof registerFeedSchema>;
