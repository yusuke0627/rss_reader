import { TagRepository } from "../ports";

export interface RemoveTagFromEntryInput {
  userId: string;
  entryId: string;
  tagId: string;
}

export interface RemoveTagFromEntryDependencies {
  tagRepository: TagRepository;
}

export class RemoveTagFromEntry {
  constructor(private readonly deps: RemoveTagFromEntryDependencies) {}

  async execute(input: RemoveTagFromEntryInput): Promise<void> {
    const tag = await this.deps.tagRepository.findByIdForUser({
      userId: input.userId,
      tagId: input.tagId,
    });

    // tagが存在しない
    if (!tag) {
      throw new Error("Tag not found");
    }

    // tagを記事から削除
    await this.deps.tagRepository.removeFromEntry({
      entryId: input.entryId,
      tagId: input.tagId,
    });
  }
}
