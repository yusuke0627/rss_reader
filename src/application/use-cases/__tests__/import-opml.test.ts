import { describe, it, expect, vi } from "vitest";
import { ImportOpml } from "../import-opml";
import type {
  FeedRepository,
  FolderRepository,
  OpmlService,
  ParsedOpmlSubscription,
} from "@/application/ports";
import type { Feed, Folder } from "@/domain/entities";

// ==========================================================================
// 【テストガイドライン: ImportOpml】
//
// 1. ループ内処理のテスト
//    - OPML 登録は複数のフィードをループで処理します。
//    - 「1件目は新規フォルダ」「2件目は既存フォルダ」といった複合的なシナリオをテストします。
//
// 2. キャッシュロジックの検証
//    - ImportOpml は内部でフォルダのキャッシュ（Map）を持っています。
//    - 同じフォルダ名のフィードが複数あるとき、FolderRepository.create が
//      重複して呼ばれないことを確認するのがポイントです。
//
// 3. 部分失敗 (Resilience)
//    - 途中のフィード登録でエラーが起きても、処理が中断されずに最後まで
//      実行されるか（importedCount が正しくカウントされるか）を検証します。
// ==========================================================================

function createMockDeps() {
  return {
    opmlService: {
      parse: vi.fn(),
      build: vi.fn(),
    } as unknown as OpmlService,
    feedRepository: {
      findByUrl: vi.fn(),
      create: vi.fn(),
      createSubscription: vi.fn(),
    } as unknown as FeedRepository,
    folderRepository: {
      listByUserId: vi.fn(),
      create: vi.fn(),
    } as unknown as FolderRepository,
  };
}

// テスト用ダミーデータ
const fakeFolder: Folder = {
  id: "folder-1",
  userId: "user-1",
  name: "ニュース",
};

const fakeFeed: Feed = {
  id: "feed-1",
  url: "https://example.com/rss",
  title: "Example Feed",
  siteUrl: "https://example.com",
  lastFetchedAt: null,
  etag: null,
  lastModified: null,
};

describe("ImportOpml UseCase", () => {
  it("正常系: OPMLをパースし、フォルダとフィードを作成してインポートする", async () => {
    // ── Arrange (準備) ──
    const deps = createMockDeps();
    const useCase = new ImportOpml(deps);

    // 1. OPMLパース結果の準備
    const parsedSubs: ParsedOpmlSubscription[] = [
      {
        title: "Tech News",
        xmlUrl: "https://tech.example.com/feed",
        folderName: "IT",
      },
    ];
    vi.mocked(deps.opmlService.parse).mockResolvedValue(parsedSubs);

    // 2. リポジトリの挙動設定
    vi.mocked(deps.folderRepository.listByUserId).mockResolvedValue([]); // 最初はフォルダなし
    vi.mocked(deps.folderRepository.create).mockResolvedValue({
      ...fakeFolder,
      name: "IT",
    });
    vi.mocked(deps.feedRepository.findByUrl).mockResolvedValue(null); // 新規フィード
    vi.mocked(deps.feedRepository.create).mockResolvedValue(fakeFeed);

    // ── Act (実行) ──
    const result = await useCase.execute({
      userId: "user-1",
      opmlContent: "<opml>...</opml>",
    });

    // ── Assert (検証) ──
    expect(result.importedCount).toBe(1);

    // フォルダが作成されたか
    expect(deps.folderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "IT" }),
    );
    // フィードと購読が作成されたか
    expect(deps.feedRepository.create).toHaveBeenCalled();
    expect(deps.feedRepository.createSubscription).toHaveBeenCalled();
  });

  it("正常系: フォルダがすでに存在する場合は再利用する", async () => {
    // ── Arrange (準備) ──
    const deps = createMockDeps();
    const useCase = new ImportOpml(deps);

    // 1. OPMLパース結果の準備
    const parsedSubs: ParsedOpmlSubscription[] = [
      {
        title: "Tech News",
        xmlUrl: "https://tech.example.com/feed",
        folderName: "IT",
      },
    ];

    // すでに存在するfolder
    const fakeFolder = {
      id: "folder-1",
      userId: "user-1",
      name: "IT",
      createdAt: new Date(),
    };

    const fakeFeed = {
      id: "feed-1",
      url: "https://tech.example.com/feed",
      title: "Tech News",
      siteUrl: "https://tech.example.com",
      lastFetchedAt: null,
      etag: null,
      lastModified: null,
    };

    vi.mocked(deps.opmlService.parse).mockResolvedValue(parsedSubs);

    // 2. リポジトリの挙動設定
    vi.mocked(deps.folderRepository.listByUserId).mockResolvedValue([
      fakeFolder,
    ]);

    vi.mocked(deps.folderRepository.create).mockResolvedValue({
      ...fakeFolder,
    });
    vi.mocked(deps.feedRepository.findByUrl).mockResolvedValue(null); // 新規フィード
    vi.mocked(deps.feedRepository.create).mockResolvedValue(fakeFeed);

    // ── Act (実行) ──
    const result = await useCase.execute({
      userId: "user-1",
      opmlContent: "<opml>...</opml>",
    });

    // ── Assert (検証) ──
    expect(result.importedCount).toBe(1);

    // すでに存在するフォルダを利用したか
    expect(deps.folderRepository.create).not.toHaveBeenCalled();
    // フィードと購読が作成された
    expect(deps.feedRepository.create).toHaveBeenCalled();
    expect(deps.feedRepository.createSubscription).toHaveBeenCalled();
  });

  it("ロバスト性: 一部のフィード登録が失敗(createSubscriptionに失敗)しても、他の登録を続行する", async () => {
    // 「1件エラーが起きても importedCount が増えること」
    const deps = createMockDeps();
    const useCase = new ImportOpml(deps);

    // 2件のフィード
    const parsedSubs: ParsedOpmlSubscription[] = [
      { title: "Fail Feed", xmlUrl: "https://fail.com/rss" },
      { title: "Success Feed", xmlUrl: "https://success.com/rss" },
    ];
    vi.mocked(deps.opmlService.parse).mockResolvedValue(parsedSubs);
    vi.mocked(deps.folderRepository.listByUserId).mockResolvedValue([]);
    // 2. 1件目の購読作成でわざとエラーを投げる
    vi.mocked(deps.feedRepository.findByUrl).mockResolvedValue(null); //新規feed
    vi.mocked(deps.feedRepository.create).mockResolvedValue(fakeFeed);
    vi.mocked(deps.feedRepository.createSubscription)
      .mockRejectedValueOnce(new Error("DB Error")) // 1回目は失敗
      .mockResolvedValueOnce({} as any); // 2回目は成功

    //Act
    const result = await useCase.execute({
      userId: "user-1",
      opmlContent: "<opml>...</opml>",
    });

    //Assert
    // 1件失敗しても残りはOK
    expect(result.importedCount).toBe(1);

    // createSubscriptionは二回呼ばれる
    expect(deps.feedRepository.createSubscription).toHaveBeenCalledTimes(2);
  });
});
