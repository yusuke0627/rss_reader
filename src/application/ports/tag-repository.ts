import type { Tag } from "@/domain/entities";

export interface TagRepository {
  listByUserId(userId: string): Promise<Tag[]>;
  findByIdForUser(input: { userId: string; tagId: string }): Promise<Tag | null>;
  create(input: { userId: string; name: string }): Promise<Tag>;
  delete(input: { userId: string; tagId: string }): Promise<void>;
}
