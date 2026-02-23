import { TagRepository } from "../ports";

export interface DeleteTagInput {
  userId: string;
  tagId: string;
}

export interface DeleteTagDependencies {
  tagRepository: TagRepository;
}

export class DeleteTag {
  constructor(private readonly deps: DeleteTagDependencies) {}
  async execute(input: DeleteTagInput): Promise<void> {
    const tag = await this.deps.tagRepository.findByIdForUser({
      userId: input.userId,
      tagId: input.tagId,
    });

    if (!tag) {
      throw new Error("Tag not found");
    }

    await this.deps.tagRepository.delete({
      userId: input.userId,
      tagId: input.tagId,
    });
  }
}
