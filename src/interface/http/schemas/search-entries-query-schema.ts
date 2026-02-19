import { z } from "zod";

const unreadSchema = z
  .enum(["1", "0", "true", "false"])
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }
    return value === "1" || value === "true";
  });

export const searchEntriesQuerySchema = z.object({
  feedId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  unread: unreadSchema,
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  cursor: z.string().optional(),
});

export type SearchEntriesQuery = z.infer<typeof searchEntriesQuerySchema>;
