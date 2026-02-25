import { describe, it, expect, vi } from "vitest";
import { SearchEntries } from "../search-entries";
import type { EntryRepository, SearchRepository } from "@/application/ports";
import type { Entry } from "@/domain/entities";

function createMockDeps() {
  const entryRepository: EntryRepository = {
    listByFilter: vi.fn(),
    findByIdForUser: vi.fn(),
    saveFetchedEntries: vi.fn(),
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
    toggleBookmark: vi.fn(),
    listPublicEntriesBySlug: vi.fn(),
    updateSummary: vi.fn(),
  };

  const searchRepository: SearchRepository = {
    searchEntries: vi.fn(),
    indexEntries: vi.fn(),
  };

  return { entryRepository, searchRepository };
}

const fakeEntries: Entry[] = [
  {
    id: "entry-1",
    feedId: "feed-1",
    guid: "guid-1",
    title: "検索結果の記事",
    url: "https://example.com/1",
    content: "検索キーワードを含む内容",
    author: "著者1",
    summary: null,
    createdAt: new Date("2026-01-01"),
    publishedAt: new Date("2026-01-01"),
  },
];

describe("SearchEntries UseCase", () => {
  it("正常系: 検索語がある場合は SearchRepository.searchEntries が呼ばれる", async () => {
    const deps = createMockDeps();
    (
      deps.searchRepository.searchEntries as ReturnType<typeof vi.fn>
    ).mockResolvedValue(fakeEntries);

    const useCase = new SearchEntries(deps);
    const input = {
      userId: "user-1",
      search: "React", // UseCase の入力は search
      folderId: "folder-1",
      unreadOnly: true,
      limit: 20,
    };

    const result = await useCase.execute(input);

    expect(result).toEqual(fakeEntries);
    // Repository に渡る時は query という名前に変換されている
    expect(deps.searchRepository.searchEntries).toHaveBeenCalledWith({
      userId: input.userId,
      query: "React",
      folderId: input.folderId,
      unreadOnly: input.unreadOnly,
      limit: input.limit,
      feedId: undefined,
      tagId: undefined,
      cursor: undefined,
    });
  });

  it("正常系: 検索語がない場合は EntryRepository.listByFilter が呼ばれる", async () => {
    const deps = createMockDeps();
    (
      deps.entryRepository.listByFilter as ReturnType<typeof vi.fn>
    ).mockResolvedValue(fakeEntries);

    const useCase = new SearchEntries(deps);
    const input = {
      userId: "user-1",
      search: "", // 空文字（検索語なし）
      unreadOnly: false,
    };

    const result = await useCase.execute(input);

    expect(result).toEqual(fakeEntries);
    // listByFilter が呼ばれていることを確認
    expect(deps.entryRepository.listByFilter).toHaveBeenCalledWith({
      userId: input.userId,
      search: undefined,
      unreadOnly: false,
      feedId: undefined,
      folderId: undefined,
      tagId: undefined,
      limit: undefined,
      cursor: undefined,
    });
    // searchEntries は呼ばれていないはず
    expect(deps.searchRepository.searchEntries).not.toHaveBeenCalled();
  });
});
