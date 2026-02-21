import { describe, it, expect, vi } from "vitest";
import { ToggleBookmark } from "../toggle-bookmark";
import type { UserEntry, Entry } from "@/domain/entities";
import type { EntryRepository } from "@/application/ports";

function createMockDeps() {
  const entryRepository: EntryRepository = {
    findByIdForUser: vi.fn(),
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
    toggleBookmark: vi.fn(),
    listPublicEntriesBySlug: vi.fn(),
    listByFilter: vi.fn(),
    saveFetchedEntries: vi.fn(),
  };

  return { entryRepository };
}

const fakeUserEntry: UserEntry = {
  userId: "user-1",
  entryId: "entry-1",
  isRead: true,
  isBookmarked: false,
  readAt: new Date("2026-01-01"),
};

const fakeEntry: Entry = {
  id: "entry-1",
  feedId: "feed-1",
  guid: "guid-1",
  title: "記事1",
  url: "https://example.com/1",
  content: "内容1",
  author: "著者1",
  createdAt: new Date("2026-01-01"),
  publishedAt: new Date("2026-01-01"),
};
