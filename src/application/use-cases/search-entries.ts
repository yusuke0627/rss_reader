import type { Entry } from "@/domain/entities";
import type { EntryRepository, SearchRepository } from "@/application/ports";

export interface SearchEntriesInput {
  userId: string;
  feedId?: string;
  folderId?: string;
  tagId?: string;
  unreadOnly?: boolean;
  search?: string;
  limit?: number;
  cursor?: string;
}

export interface SearchEntriesDependencies {
  entryRepository: EntryRepository;
  searchRepository: SearchRepository;
}

export class SearchEntries {
  constructor(private readonly deps: SearchEntriesDependencies) {}

  async execute(input: SearchEntriesInput): Promise<Entry[]> {
    const query = input.search?.trim();

    if (query) {
      return this.deps.searchRepository.searchEntries({
        userId: input.userId,
        query,
        feedId: input.feedId,
        folderId: input.folderId,
        tagId: input.tagId,
        unreadOnly: input.unreadOnly,
        limit: input.limit,
        cursor: input.cursor,
      });
    }

    return this.deps.entryRepository.listByFilter({
      userId: input.userId,
      feedId: input.feedId,
      folderId: input.folderId,
      tagId: input.tagId,
      unreadOnly: input.unreadOnly,
      search: undefined,
      limit: input.limit,
      cursor: input.cursor,
    });
  }
}
