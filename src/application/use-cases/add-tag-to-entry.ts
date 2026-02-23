import { TagRepository } from "../ports";

export interface AddTagToEntryInput {
  userId: string;
  entryId: string;
  tagId: string;
}

export interface AddTagToEntryDependencies {
  tagRepository: TagRepository;
}

export class AddTagToEntry {
  constructor(private readonly deps: AddTagToEntryDependencies) {}

  async execute(input: AddTagToEntryInput): Promise<void> {
    // タグが自分自身のものであること
    const tag = await this.deps.tagRepository.findByIdForUser({
      userId: input.userId,
      tagId: input.tagId,
    });

    if (!tag) {
      throw new Error("Tag not found");
    }

    await this.deps.tagRepository.addToEntry({
      entryId: input.entryId,
      tagId: input.tagId,
    });
  }
}
