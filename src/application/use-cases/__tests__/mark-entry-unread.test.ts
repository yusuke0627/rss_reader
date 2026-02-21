import { describe, it, expect, vi } from "vitest";
import { EntryNotFoundError, MarkEntryUnread } from "../mark-entry-unread";

import type { EntryRepository } from "@/application/ports";
import type { UserEntry, Entry } from "@/domain/entities";

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

describe("MarkEntryUnread UseCase", () => {
  it("正常系: 記事が見つかれば未読になる", async () => {
    const deps = createMockDeps();
    (
      deps.entryRepository.findByIdForUser as ReturnType<typeof vi.fn>
    ).mockResolvedValue(fakeEntry);
    (
      deps.entryRepository.markAsRead as ReturnType<typeof vi.fn>
    ).mockResolvedValue(fakeUserEntry);

    const useCase = new MarkEntryUnread(deps); // use caseのインスタンス化
    await useCase.execute({
      entryId: "entry-1",
      userId: "user-1",
    });

    // markAsUnreadが呼ばれたか
    expect(deps.entryRepository.markAsUnread).toHaveBeenCalledTimes(1);

    // 正しいユーザの正しい記事に対して未読指示を出したか
    expect(deps.entryRepository.markAsUnread).toHaveBeenCalledWith({
      userId: "user-1",
      entryId: "entry-1",
    });
  });

  it("異常系: 記事が見つからなければEntryNotFoundErrorが投げられる", async () => {
    const deps = createMockDeps();

    (
      deps.entryRepository.findByIdForUser as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const useCase = new MarkEntryUnread(deps);

    await expect(
      useCase.execute({ entryId: "entry-1", userId: "user-1" }),
    ).rejects.toThrow(EntryNotFoundError);
  });
});
