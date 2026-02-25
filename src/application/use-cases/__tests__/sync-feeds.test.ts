// ============================================================
// サンプルテスト③: SyncFeeds UseCase のテスト（複数の依存関係）
// ============================================================
// 【学習ポイント】
//   - 複数のモックを組み合わせる方法
//   - エラーケースのテスト
//   - 条件分岐のテスト（差分なし / 新規記事あり / エラー発生）
// ============================================================

import { describe, it, expect, vi } from "vitest";
import { SyncFeeds } from "../sync-feeds";
import type {
  FeedRepository,
  EntryRepository,
  RssFetcher,
  SearchRepository,
} from "@/application/ports";
import type { Feed } from "@/domain/entities";

// ── 複数の依存関係をまとめてモック化する ──────────────
function createMockDeps() {
  const feedRepository: FeedRepository = {
    findById: vi.fn(),
    findByUrl: vi.fn(),
    create: vi.fn(),
    deleteById: vi.fn(),
    listByUserId: vi.fn(),
    createSubscription: vi.fn(),
    deleteSubscription: vi.fn(),
    updateSubscriptionFolder: vi.fn(),
    listStaleFeeds: vi.fn(),
    updateFetchMetadata: vi.fn(),
  };

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

  const rssFetcher: RssFetcher = {
    fetchFeed: vi.fn(),
  };

  const searchRepository: SearchRepository = {
    searchEntries: vi.fn(),
    indexEntries: vi.fn(),
  };

  return { feedRepository, entryRepository, rssFetcher, searchRepository };
}

// テスト用のフィードデータ。
function createFakeFeed(overrides: Partial<Feed> = {}): Feed {
  return {
    id: "feed-1",
    url: "https://example.com/feed.xml",
    title: "テストフィード",
    siteUrl: "https://example.com",
    etag: '"abc123"',
    lastModified: "Thu, 01 Jan 2026 00:00:00 GMT",
    lastFetchedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("SyncFeeds UseCase", () => {
  // --- ケース1: 更新がないとき ---
  it("差分なし(304) → 新規記事は0件、メタ情報だけ更新される", async () => {
    const deps = createMockDeps();
    const feed = createFakeFeed();

    // listStaleFeeds: 1件のフィードを返す。
    (
      deps.feedRepository.listStaleFeeds as ReturnType<typeof vi.fn>
    ).mockResolvedValue([feed]);

    // fetchFeed: 304 Not Modified を返す。
    (deps.rssFetcher.fetchFeed as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: feed.title,
      siteUrl: feed.siteUrl,
      etag: feed.etag,
      lastModified: feed.lastModified,
      entries: [],
      notModified: true,
    });

    const useCase = new SyncFeeds(deps);
    const result = await useCase.execute({ limit: 10 });

    // 処理件数は1、新規記事は0。
    expect(result.processedFeedCount).toBe(1);
    expect(result.newEntryCount).toBe(0);
    expect(result.errors).toHaveLength(0);

    // saveFetchedEntries は呼ばれない（差分がないため）。
    expect(deps.entryRepository.saveFetchedEntries).not.toHaveBeenCalled();

    // メタ情報の更新は必ず行われる。
    expect(deps.feedRepository.updateFetchMetadata).toHaveBeenCalledTimes(1);
  });

  // --- ケース2: 新しい記事があるとき ---
  it("新規記事あり → 保存 & インデックス作成が行われる", async () => {
    const deps = createMockDeps();
    const feed = createFakeFeed();

    (
      deps.feedRepository.listStaleFeeds as ReturnType<typeof vi.fn>
    ).mockResolvedValue([feed]);

    (deps.rssFetcher.fetchFeed as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: feed.title,
      siteUrl: feed.siteUrl,
      etag: '"new-etag"',
      lastModified: "Fri, 20 Feb 2026 00:00:00 GMT",
      entries: [
        { guid: "guid-1", title: "記事1", url: "https://example.com/1" },
        { guid: "guid-2", title: "記事2", url: "https://example.com/2" },
      ],
      notModified: false,
    });

    // saveFetchedEntries: 2件分のIDを返す。
    (
      deps.entryRepository.saveFetchedEntries as ReturnType<typeof vi.fn>
    ).mockResolvedValue(["entry-1", "entry-2"]);

    (
      deps.searchRepository.indexEntries as ReturnType<typeof vi.fn>
    ).mockResolvedValue(undefined);

    const useCase = new SyncFeeds(deps);
    const result = await useCase.execute({ limit: 10 });

    expect(result.processedFeedCount).toBe(1);
    expect(result.newEntryCount).toBe(2);
    expect(result.errors).toHaveLength(0);

    // saveFetchedEntries が正しいフィードIDで呼ばれたか
    expect(deps.entryRepository.saveFetchedEntries).toHaveBeenCalledWith(
      expect.objectContaining({ feedId: "feed-1" }),
    );

    // indexEntries が正しいIDリストで呼ばれたか
    expect(deps.searchRepository.indexEntries).toHaveBeenCalledWith([
      "entry-1",
      "entry-2",
    ]);
  });

  // --- ケース3: フィードの取得でエラーが発生したとき ---
  it("フィード取得エラー → errors 配列に記録され、処理は続行する", async () => {
    const deps = createMockDeps();
    const goodFeed = createFakeFeed({
      id: "feed-good",
      url: "https://good.com/feed",
    });
    const badFeed = createFakeFeed({
      id: "feed-bad",
      url: "https://bad.com/feed",
    });

    (
      deps.feedRepository.listStaleFeeds as ReturnType<typeof vi.fn>
    ).mockResolvedValue([goodFeed, badFeed]);

    // 1件目: 成功（差分なし）
    // 2件目: エラー
    (deps.rssFetcher.fetchFeed as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        title: goodFeed.title,
        siteUrl: null,
        etag: null,
        lastModified: null,
        entries: [],
        notModified: true,
      })
      .mockRejectedValueOnce(new Error("Failed to fetch feed: 404"));

    const useCase = new SyncFeeds(deps);
    const result = await useCase.execute({ limit: 10 });

    // 成功した分だけカウントされる。
    expect(result.processedFeedCount).toBe(1);
    // エラーは配列に記録される。
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].feedUrl).toBe("https://bad.com/feed");
    expect(result.errors[0].error).toContain("404");
  });
});
