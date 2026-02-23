import { describe, it, expect, vi } from "vitest";
import { RegisterFeed, InvalidFeedUrlError } from "../register-feed";
import type {
  FeedRepository,
  EntryRepository,
  RssFetcher,
  SearchRepository,
} from "@/application/ports";
import type { Feed, Subscription, Entry } from "@/domain/entities";

// ==========================================================================
// 【テストガイドライン: RegisterFeed】
//
// 1. モック (Mocking)
//    - UseCase が依存するリポジトリやサービスはすべて vi.fn() でモック化します。
//    - データベースやネットワーク通信を実際に行わずに、挙動をシミュレートします。
//
// 2. AAAパターン (Arrange, Act, Assert)
//    - Arrange (準備): モックの戻り値設定や入力データの用意。
//    - Act (実行): テスト対象のメソッドを呼び出す。
//    - Assert (検証): 期待した結果になったか、依存先が正しく呼ばれたかを確認。
//
// 3. 境界条件の検証
//    - 正常系だけでなく、空文字、不正なURL、外部エラーなどの異常系も網羅します。
// ==========================================================================

function createMockDeps() {
  return {
    feedRepository: {
      findByUrl: vi.fn(),
      create: vi.fn(),
      updateFetchMetadata: vi.fn(),
      createSubscription: vi.fn(),
    } as unknown as FeedRepository,
    entryRepository: {
      listByFilter: vi.fn(),
      saveFetchedEntries: vi.fn(),
    } as unknown as EntryRepository,
    rssFetcher: {
      fetchFeed: vi.fn(),
    } as unknown as RssFetcher,
    searchRepository: {
      indexEntries: vi.fn(),
    } as unknown as SearchRepository,
  };
}

// テスト用ダミーデータ
const fakeFeed: Feed = {
  id: "feed-1",
  url: "https://example.com/rss",
  title: "Example Feed",
  siteUrl: "https://example.com",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastFetchedAt: null,
  etag: "fake-etag",
  lastModified: "2026-02-22",
};

const fakeSubscription: Subscription = {
  id: "sub-1",
  userId: "user-1",
  feedId: "feed-1",
  folderId: null,
  createdAt: new Date(),
};

const fakeEntry: Entry = {
  id: "entry-1",
  feedId: "feed-1",
  guid: "guid-1",
  title: "既存の記事",
  url: "https://example.com/1",
  content: "内容",
  author: "著者",
  publishedAt: new Date(),
  createdAt: new Date(),
};

describe("RegisterFeed UseCase", () => {
  it("正常系: 新規フィードを登録し、記事を保存して購読を作成する", async () => {
    // ── Arrange (準備) ──
    const deps = createMockDeps();
    const useCase = new RegisterFeed(deps);

    // 1. フィードがまだ存在しない (null)
    vi.mocked(deps.feedRepository.findByUrl).mockResolvedValue(null);
    // 2. RSSフェッチャーが成功レスポンスを返す
    vi.mocked(deps.rssFetcher.fetchFeed).mockResolvedValue({
      title: "Example Feed",
      siteUrl: "https://example.com",
      entries: [
        { guid: "guid-1", title: "記事1", url: "https://example.com/1" },
      ],
      notModified: false,
    });
    // 3. 各リポジトリの作成・保存処理
    vi.mocked(deps.feedRepository.create).mockResolvedValue(fakeFeed);
    vi.mocked(deps.entryRepository.listByFilter).mockResolvedValue([]); // DBが空であることを示す
    vi.mocked(deps.entryRepository.saveFetchedEntries).mockResolvedValue([
      "entry-1",
    ]);
    vi.mocked(deps.feedRepository.createSubscription).mockResolvedValue(
      fakeSubscription,
    );

    // ── Act (実行) ──
    const result = await useCase.execute({
      userId: "user-1",
      url: "https://example.com/rss",
    });

    // ── Assert (検証) ──
    // 1. 戻り値の確認
    expect(result.feed.id).toBe("feed-1");
    expect(result.insertedEntryCount).toBe(1);

    // 2. 依存関係の呼び出し確認
    expect(deps.rssFetcher.fetchFeed).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://example.com/rss" }),
    );
    expect(deps.entryRepository.saveFetchedEntries).toHaveBeenCalled();
    expect(deps.searchRepository.indexEntries).toHaveBeenCalledWith([
      "entry-1",
    ]);
    expect(deps.feedRepository.createSubscription).toHaveBeenCalled();
  });

  it("正常系: Feedがすでに存在して、記事の更新がない場合", async () => {
    // ── Arrange (準備) ──
    const deps = createMockDeps();
    const useCase = new RegisterFeed(deps);

    // 1. フィードがすでに存在する
    vi.mocked(deps.feedRepository.findByUrl).mockResolvedValue(fakeFeed);

    // 2. DBにはすでに記事がある（空ではない）と設定
    vi.mocked(deps.entryRepository.listByFilter).mockResolvedValue([fakeEntry]);

    // 3. RSSフェッチャーがnotModified: trueを返すように準備
    vi.mocked(deps.rssFetcher.fetchFeed).mockResolvedValue({
      title: "Example Feed",
      siteUrl: "https://example.com",
      entries: [],
      notModified: true,
    });

    // 3. fetch Meta情報を更新
    vi.mocked(deps.feedRepository.updateFetchMetadata).mockResolvedValue();

    // ── Act (実行) ──
    await useCase.execute({
      userId: "user-1",
      url: "https://example.com/rss",
    });

    // ── Assert (検証) ──
    // fetchFeed が、DBから取得した etag 等を正しく送信しているか？
    expect(deps.rssFetcher.fetchFeed).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://example.com/rss",
        etag: "fake-etag",
        lastModified: "2026-02-22",
      }),
    );

    // 更新がない(304)のでsaveFetchedEntriesは呼ばれない
    expect(deps.entryRepository.saveFetchedEntries).not.toHaveBeenCalled();

    // 更新がない場合でもupdateFetchMetadata(最終更新日などの更新)は呼ばれる
    expect(deps.feedRepository.updateFetchMetadata).toHaveBeenCalled();
  });

  it("異常系: 不正なURL形式の場合は InvalidFeedUrlError を投げる", async () => {
    // ── Arrange (準備) ──
    const deps = createMockDeps();
    const useCase = new RegisterFeed(deps);

    // ── Act & Assert (実行と検証) ──
    // execute自体が例外を投げることを検証する場合は、await expect(...).rejects を使います。
    await expect(
      useCase.execute({ userId: "user-1", url: "not-a-url" }),
    ).rejects.toThrow(InvalidFeedUrlError);
  });

  it("異常系: RSSエッチャーがエラーを返す場合はエラーを投げる", async () => {
    // Arrange
    const deps = createMockDeps();
    const useCase = new RegisterFeed(deps);

    // 1. フィードはまだ存在しない (新規登録ルート)
    vi.mocked(deps.feedRepository.findByUrl).mockResolvedValue(null);

    const networkError = new Error("Network Error");
    vi.mocked(deps.rssFetcher.fetchFeed).mockRejectedValue(networkError);

    // Act & Assert
    await expect(
      useCase.execute({ userId: "user-1", url: "https://example.com/rss" }),
    ).rejects.toThrow("Network Error");
  });
});
