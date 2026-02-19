import type { TagRepository } from "@/application/ports";
import type { Tag } from "@/domain/entities";
import { createId, inMemoryStore } from "./in-memory-store";

export class InMemoryTagRepository implements TagRepository {
  async listByUserId(userId: string): Promise<Tag[]> {
    return inMemoryStore.tags.filter((tag) => tag.userId === userId);
  }

  async findByIdForUser(input: { userId: string; tagId: string }): Promise<Tag | null> {
    return (
      inMemoryStore.tags.find((tag) => tag.userId === input.userId && tag.id === input.tagId) ??
      null
    );
  }

  async create(input: { userId: string; name: string }): Promise<Tag> {
    const tag: Tag = {
      id: createId(),
      userId: input.userId,
      name: input.name,
    };
    inMemoryStore.tags.push(tag);
    return tag;
  }

  async delete(input: { userId: string; tagId: string }): Promise<void> {
    inMemoryStore.tags = inMemoryStore.tags.filter(
      (tag) => !(tag.userId === input.userId && tag.id === input.tagId),
    );
    inMemoryStore.entryTags = inMemoryStore.entryTags.filter(
      (entryTag) => entryTag.tagId !== input.tagId,
    );
  }
}
