import { EntryRepository } from "@/application/ports";
import { describe, expect, it, vi } from "vitest";
import { GetEntriesByTag } from "../get-entries-by-tag";

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

  return { entryRepository };
}

const fakeEntry = {
  id: "entry-1",
  feedId: "feed-1",
  guid: "guid-1",
  title: "title-1",
  url: "url-1",
  content: "content-1",
  publishedAt: new Date(),
  author: "author-1",
  createdAt: new Date(),
  summary: null,
};

describe("GetEntriesByTag useCase", () => {
  it("正常系: タグに結びつく記事を返す", async () => {
    // Arrange
    const deps = createMockDeps();
    vi.mocked(deps.entryRepository.listByFilter).mockResolvedValue([fakeEntry]);

    // Act
    const useCase = new GetEntriesByTag(deps);
    const result = await useCase.execute({
      tagId: "tag-1",
      userId: "user-1",
    });
    expect(result).toEqual([fakeEntry]);
  });
});
