import type { Entry } from "@/domain/entities";

export interface SearchEntriesInput {
  userId: string;
  query: string;
  feedId?: string;
  folderId?: string;
  tagId?: string;
  unreadOnly?: boolean;
  limit?: number;
  cursor?: string;
}

export interface SearchRepository {
  searchEntries(input: SearchEntriesInput): Promise<Entry[]>;
  indexEntries(entryIds: string[]): Promise<void>;
}
