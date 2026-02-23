import { describe, it, expect, vi } from "vitest";
import { ExportOpml } from "../export-opml";
import type { FeedRepository, OpmlService } from "@/application/ports";
import type { Feed } from "@/domain/entities";

function createMockDeps() {
  return {
    feedRepository: {
      listByUserId: vi.fn(),
    } as unknown as FeedRepository,
    opmlService: {
      build: vi.fn(),
    } as unknown as OpmlService,
  };
}

const fakeFeeds: Feed[] = [
  {
    id: "feed-1",
    url: "https://example1.com/rss",
    title: "Feed 1",
    siteUrl: "https://example1.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastFetchedAt: null,
    etag: null,
    lastModified: null,
  },
  {
    id: "feed-2",
    url: "https://example2.com/rss",
    title: "Feed 2",
    siteUrl: null, // htmlUrl が無い場合を想定
    createdAt: new Date(),
    updatedAt: new Date(),
    lastFetchedAt: null,
    etag: null,
    lastModified: null,
  },
];

describe("ExportOpml UseCase", () => {
  it("正常系: ユーザーのフィードを取得し、OPML形式で出力する", async () => {
    // ── Arrange ──
    const deps = createMockDeps();
    const useCase = new ExportOpml(deps);

    vi.mocked(deps.feedRepository.listByUserId).mockResolvedValue(fakeFeeds);
    vi.mocked(deps.opmlService.build).mockResolvedValue(
      "<opml>fake xml</opml>",
    );

    // ── Act ──
    const result = await useCase.execute({ userId: "user-1" });

    // ── Assert ──
    expect(result).toBe("<opml>fake xml</opml>");

    // Repository が呼ばれたか
    expect(deps.feedRepository.listByUserId).toHaveBeenCalledWith("user-1");

    // OpmlService.build に渡された引数の検証
    expect(deps.opmlService.build).toHaveBeenCalledWith([
      {
        title: "Feed 1",
        xmlUrl: "https://example1.com/rss",
        htmlUrl: "https://example1.com",
      },
      {
        title: "Feed 2",
        xmlUrl: "https://example2.com/rss",
        htmlUrl: undefined,
      },
    ]);
  });
});
