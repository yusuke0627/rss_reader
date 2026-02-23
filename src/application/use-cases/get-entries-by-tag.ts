import { Entry } from "@/domain/entities/entry";
import { EntryRepository } from "@/application/ports";

export interface GetEntriesByTagInput {
  tagId: string;
  userId: string;
}

export interface GetEntriesByTagDependencies {
  entryRepository: EntryRepository;
}

export class GetEntriesByTag {
  constructor(private readonly deps: GetEntriesByTagDependencies) {}

  async execute(input: GetEntriesByTagInput): Promise<Entry[]> {
    return this.deps.entryRepository.listByFilter({
      tagId: input.tagId,
      userId: input.userId,
    });
  }
}
