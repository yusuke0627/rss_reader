import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name cannot be empty").max(50, "Tag name is too long"),
});

export type CreateTagBody = z.infer<typeof createTagSchema>;
