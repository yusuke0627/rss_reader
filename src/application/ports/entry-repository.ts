import type { Entry, UserEntry } from "@/domain/entities";

export interface EntryFilter {
  userId: string;
  feedId?: string;
  folderId?: string;
  tagId?: string;
  unreadOnly?: boolean;
  bookmarkedOnly?: boolean;
  search?: string;
  limit?: number;
  cursor?: string;
}

export interface SaveFetchedEntriesInput {
  feedId: string;
  entries: Array<{
    guid: string;
    title: string;
    url: string;
    content?: string | null;
    publishedAt?: Date | null;
    author?: string | null;
  }>;
}

export interface EntryRepository {
  listByFilter(filter: EntryFilter): Promise<Entry[]>;
  findByIdForUser(input: { userId: string; entryId: string }): Promise<Entry | null>;
  saveFetchedEntries(input: SaveFetchedEntriesInput): Promise<number>;
  markAsRead(input: { userId: string; entryId: string; readAt: Date }): Promise<UserEntry>;
  markAsUnread(input: { userId: string; entryId: string }): Promise<UserEntry>;
  toggleBookmark(input: {
    userId: string;
    entryId: string;
    isBookmarked: boolean;
  }): Promise<UserEntry>;
  listPublicEntriesBySlug(input: {
    slug: string;
    limit?: number;
    cursor?: string;
  }): Promise<Entry[]>;
}
