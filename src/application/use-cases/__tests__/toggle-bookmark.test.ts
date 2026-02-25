import { describe, it, expect, vi } from "vitest";
import { ToggleBookmark } from "../toggle-bookmark";
import type { UserEntry, Entry } from "@/domain/entities";
import type { EntryRepository } from "@/application/ports";
import { EntryNotFoundError } from "../mark-entry-read";

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
  createdAt: new Date("2026-01-01"),
  publishedAt: new Date("2026-01-01"),
  summary: null,
};

describe("ToggleBookmark UseCase", () => {
  //
  it("正常系: 記事があればブックマークにする", async () => {
    const deps = createMockDeps();
    // fakeEntryを返すMock
    (
      deps.entryRepository.findByIdForUser as ReturnType<typeof vi.fn>
    ).mockResolvedValue(fakeEntry);
    // fakeUserEntryを返すMock
    (
      deps.entryRepository.toggleBookmark as ReturnType<typeof vi.fn>
    ).mockResolvedValue(fakeUserEntry);

    const useCase = new ToggleBookmark(deps);
    await useCase.execute({
      userId: "user-1",
      entryId: "entry-1",
      isBookmarked: true,
    });

    // toggleBookmarkが一度呼ばれる
    expect(deps.entryRepository.toggleBookmark).toHaveBeenCalledTimes(1);
    // 正しいユーザの正しい記事に対してブックマーク指示を出したか
    expect(deps.entryRepository.toggleBookmark).toHaveBeenCalledWith({
      userId: "user-1",
      entryId: "entry-1",
      isBookmarked: true,
    });
  });

  it("正常系: 記事があればブックマークを外す", async () => {
    const deps = createMockDeps();
    // fakeEntryを返すMock
    (
      deps.entryRepository.findByIdForUser as ReturnType<typeof vi.fn>
    ).mockResolvedValue(fakeEntry);
    // fakeUserEntryを返すMock
    (
      deps.entryRepository.toggleBookmark as ReturnType<typeof vi.fn>
    ).mockResolvedValue(fakeUserEntry);

    const useCase = new ToggleBookmark(deps);
    await useCase.execute({
      userId: "user-1",
      entryId: "entry-1",
      isBookmarked: false,
    });

    // toggleBookmarkが一度呼ばれる
    expect(deps.entryRepository.toggleBookmark).toHaveBeenCalledTimes(1);
    // 正しいユーザの正しい記事に対してブックマーク解除指示を出したか
    expect(deps.entryRepository.toggleBookmark).toHaveBeenCalledWith({
      userId: "user-1",
      entryId: "entry-1",
      isBookmarked: false,
    });
  });

  it("異常系: 記事が見つからなければEntryNotFoundErrorが投げられる", async () => {
    const deps = createMockDeps();

    (
      deps.entryRepository.findByIdForUser as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const useCase = new ToggleBookmark(deps);

    await expect(
      useCase.execute({
        userId: "user-1",
        entryId: "entry-1",
        isBookmarked: true,
      }),
    ).rejects.toThrow(EntryNotFoundError);
  });
});
