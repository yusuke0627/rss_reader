import type { Entry } from "@/domain/entities";

// FTS など検索専用のI/Oを切り離すための契約。
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
