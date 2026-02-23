import type { TagRepository } from "@/application/ports";
import type { Tag } from "@/domain/entities";
import { createId, inMemoryStore } from "./in-memory-store";

export class InMemoryTagRepository implements TagRepository {
  async listByUserId(userId: string): Promise<Tag[]> {
    return inMemoryStore.tags.filter((tag) => tag.userId === userId);
  }

  async findByIdForUser(input: {
    userId: string;
    tagId: string;
  }): Promise<Tag | null> {
    return (
      inMemoryStore.tags.find(
        (tag) => tag.userId === input.userId && tag.id === input.tagId,
      ) ?? null
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

  async addToEntry(input: { entryId: string; tagId: string }): Promise<void> {
    const entryTag = inMemoryStore.entryTags.find(
      (entryTag) =>
        entryTag.entryId === input.entryId && entryTag.tagId === input.tagId,
    );
    // 指定したentryId, tagIdに対応するentryTagが存在する場合
    if (entryTag) {
      return;
    }

    inMemoryStore.entryTags.push({
      entryId: input.entryId,
      tagId: input.tagId,
    });
  }

  async listByEntryId(input: {
    entryId: string;
    userId: string;
  }): Promise<Tag[]> {
    // 1. まず、その記事に関連付けられた中間データ(entry_id, tag_id)を filter で集める
    const entryTags = inMemoryStore.entryTags.filter(
      (entryTag) => entryTag.entryId === input.entryId,
    );

    // 2. tags の中から、「entryTags の中に自分の ID が含まれているもの」だけをさらに filter する
    return inMemoryStore.tags.filter((tag) =>
      // entryTags の中に、1つでも [このタグのID] を持つものがあるか？を some でチェック
      entryTags.some(
        (et) => et.tagId === tag.id && tag.userId === input.userId,
      ),
    );
  }

  async removeFromEntry(input: {
    entryId: string;
    tagId: string;
  }): Promise<void> {
    inMemoryStore.entryTags = inMemoryStore.entryTags.filter(
      (entryTag) =>
        !(entryTag.entryId === input.entryId && entryTag.tagId === input.tagId),
    );
  }
}
