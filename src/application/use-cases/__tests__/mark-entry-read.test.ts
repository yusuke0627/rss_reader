import { describe, it, expect, vi } from "vitest";
import { EntryNotFoundError, MarkEntryRead } from "../mark-entry-read";

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
    updateSummary: vi.fn(),
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
  publishedAt: new Date("2026-01-01"),
  summary: null,
  createdAt: new Date("2026-01-01"),
};

describe("MarkEntryRead UseCase", () => {
  it("正常系: 記事が見つかれば既読にされる", async () => {
    const deps = createMockDeps();
    (
      deps.entryRepository.findByIdForUser as ReturnType<typeof vi.fn>
    ).mockResolvedValue(fakeEntry);
    (
      deps.entryRepository.markAsRead as ReturnType<typeof vi.fn>
    ).mockResolvedValue(fakeUserEntry);
    const useCase = new MarkEntryRead(deps);
    await useCase.execute({
      entryId: "entry-1",
      userId: "user-1",
    });
    // markAsReadが呼ばれたか
    expect(deps.entryRepository.markAsRead).toHaveBeenCalledTimes(1);

    // 正しいユーザーの正しい記事に対して既読指示を出したか
    expect(deps.entryRepository.markAsRead).toHaveBeenCalledWith({
      userId: "user-1",
      entryId: "entry-1",
      readAt: expect.any(Date), // Dateであれば何でもOK
    });
  });

  it("異常系: 記事が見つからなければEntryNotFoundErrorが投げられる", async () => {
    const deps = createMockDeps();
    (
      deps.entryRepository.findByIdForUser as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null); //記事が見つからない

    const useCase = new MarkEntryRead(deps);

    await expect(
      useCase.execute({ entryId: "entry-1", userId: "user-1" }),
    ).rejects.toThrow(EntryNotFoundError);
  });
});
