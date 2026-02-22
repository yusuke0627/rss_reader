# RegisterFeed UseCase 実装ガイドライン

## 📋 概要

`RegisterFeed` は、**ユーザーが新しいRSSフィードを登録する** ユースケースです。

既に実装されていますが、以下のガイドラインに従って理解し、テストと実装を検証できます。

---

## 🎯 処理フロー（6ステップ）

### Step 1: URL正規化
```typescript
const normalizedUrl = this.normalizeUrl(input.url);
```

**役割**: URLの妥当性チェック + 正規化

**何をする**:
- スペースをトリム（`"  https://example.com  "` → `"https://example.com"`）
- `URL` コンストラクタで URL パースを試みる
- プロトコルが `http:` または `https:` か確認
- すべてチェックが通ったら、正規化されたURL文字列を返す
- チェック失敗時は `InvalidFeedUrlError` をスロー

**エラーケース**:
- 空文字列 / スペースだけ → エラー
- 無効なURL形式 → エラー
- HTTP/HTTPS以外 → エラー

---

### Step 2: 既存フィードの確認or新規作成

```typescript
let feed = await this.deps.feedRepository.findByUrl(normalizedUrl);

if (!feed) {
  fetched = await this.deps.rssFetcher.fetchFeed({ url: normalizedUrl });
  feed = await this.deps.feedRepository.create({
    url: normalizedUrl,
    title: fetched.title || normalizedUrl,
    siteUrl: fetched.siteUrl ?? null,
  });
}
```

**役割**: フィード情報の取得 or 新規作成

**何をする**:
1. **既存フィード確認**: `findByUrl()` でURLが既に登録済みかチェック
2. **存在しない場合**: 
   - `rssFetcher.fetchFeed()` でRSSコンテンツを取得
   - タイトル・サイトURL を取得
   - `feedRepository.create()` で新フィードを DB に作成
3. **存在する場合**: 既存フィードを再利用（新しく fetch しない可能性）

**ポイント**:
- 同じURLが複数回登録されることを防止
- 初回取得時のみフェッチが必要

---

### Step 3: DB内の記事数確認 + 差分取得プラン決定

```typescript
const entriesCount = await this.deps.entryRepository.listByFilter({
  userId: input.userId,
  feedId: feed.id,
  limit: 1,
});

const isDbEmpty = entriesCount.length === 0;

fetched ??= await this.deps.rssFetcher.fetchFeed({
  url: feed.url,
  etag: isDbEmpty ? undefined : feed.etag,
  lastModified: isDbEmpty ? undefined : feed.lastModified,
});
```

**役割**: DB が空か判定し、差分取得戦略を決める

**何をする**:
1. **ユーザーがこのフィードの記事を持っているか確認**:
   - `listByFilter()` で `limit: 1` として1件だけ問合せ
   - 0件 = DB空、1件以上 = DB非空
2. **差分取得戦略決定**:
   - **DB空**: `etag` / `lastModified` を渡さない → 全件取得
   - **DB非空**: `etag` / `lastModified` を渡す → 差分取得（304対応）

**なぜこうするのか**:
- フィードが新規の場合、記事が1件もないことがある
- このとき ETag/Last-Modified を使うと余計な 304 応答がくる
- DBが空 = 記事を全部欲しい状態なので、メタ情報は無視して全件取得

---

### Step 4: 記事の保存 + インデックス作成

```typescript
let insertedEntryIds: string[] = [];
if (!fetched.notModified && fetched.entries.length > 0) {
  insertedEntryIds = await this.deps.entryRepository.saveFetchedEntries({
    feedId: feed.id,
    entries: fetched.entries,
  });

  // 検索用インデックスを作成。
  await this.deps.searchRepository.indexEntries(insertedEntryIds);
}
```

**役割**: 新しい記事を DB に保存し、検索インデックスを作成

**何をする**:
1. **条件確認**:
   - `fetched.notModified === false` : コンテンツに更新がある（304 でない）
   - `fetched.entries.length > 0` : 記事が存在する
2. **以上ならば**:
   - `saveFetchedEntries()` で記事を DB に保存
   - 返されたエントリーID配列を使って `indexEntries()` でフルテキストサーチのインデックス作成

**ポイント**:
- 304 (Not Modified) なら保存しない
- 記事が0件なら保存しない

---

### Step 5: メタデータ更新

```typescript
await this.deps.feedRepository.updateFetchMetadata({
  feedId: feed.id,
  etag: fetched.etag ?? null,
  lastModified: fetched.lastModified ?? null,
  lastFetchedAt: new Date(),
});
```

**役割**: 次回差分取得用のメタ情報を更新

**何をする**:
- `etag`: HTTP レスポンスの ETag 値（次回フェッチで使用）
- `lastModified`: HTTP レスポンスの Last-Modified 値
- `lastFetchedAt`: 今の時刻（次回同期対象判定に使用）

**ポイント**:
- 304 の場合でも更新（最後にチェックした時刻を記録）
- これがないと毎回全件取得になる

---

### Step 6: ユーザー購読の作成

```typescript
const subscription = await this.deps.feedRepository.createSubscription({
  userId: input.userId,
  feedId: feed.id,
  folderId: input.folderId ?? null,
});

return {
  feed,
  subscription,
  insertedEntryCount: insertedEntryIds.length,
};
```

**役割**: ユーザーとフィードの関連付け（購読情報作成）

**何をする**:
- `userId`, `feedId`, `folderId` の購読レコードを作成
- `folderId` は省略可能（`null` でもOK）

**返り値**:
- フィード情報
- 購読情報
- 保存した記事数

---

## 🧪 テスト実行コマンド

```bash
# 全テスト実行
npm test

# 特定ファイルのテストのみ
npm test src/application/use-cases/__tests__/register-feed.test.ts

# Watch モード（ファイル変更時に自動実行）
npm test -- --watch
```

---

## 📚 テストの見方（各グループの役割）

| グループ | テスト内容 | 実装でチェックすべき箇所 |
|---------|----------|----------------------|
| **URL正規化** | URL妥当性チェック＆正規化 | `normalizeUrl()` メソッド |
| **既存フィード再利用** | 同じURLが登録済みなら再利用 | `findByUrl()` の処理 |
| **新規フィード作成** | 未登録URLなら新規作成 | `create()` の呼び出し |
| **DB空の差分取得** | DB空なら全件取得 | `etag/lastModified` が `undefined` |
| **DB非空の差分取得** | DB非空なら差分取得 | `etag/lastModified` が渡される |
| **304対応** | 更新がなければ記事保存しない | `notModified === true` 時の分岐 |
| **記事保存＆インデックス** | 新記事を保存＆インデックス作成 | `saveFetchedEntries()` + `indexEntries()` |
| **メタデータ更新** | 次回差分取得用データを更新 | `updateFetchMetadata()` の呼び出し |
| **購読作成** | ユーザー購読レコード作成 | `createSubscription()` の呼び出し |

---

## 💡 実装しながらテストを確認するTips

### 1. まず1つのテストを実行してFAILさせる
```bash
npm test src/application/use-cases/__tests__/register-feed.test.ts -- -t "正常系.*正しいHTTPS"
```

### 2. テストの `Arrange（準備）→ Act（実行）→ Assert（検証）` を読む
```typescript
it("正常系: 記事が見つかれば既読にされる", async () => {
  // ── Arrange（準備）── 
  const deps = createMockDeps();
  (deps.entryRepository.markAsRead as ReturnType<typeof vi.fn>).mockResolvedValue(fakeUserEntry);
  const useCase = new MarkEntryRead(deps);

  // ── Act（実行）──
  await useCase.execute({ entryId: "entry-1", userId: "user-1" });

  // ── Assert（検証）──
  expect(deps.entryRepository.markAsRead).toHaveBeenCalledTimes(1);
});
```

### 3. モックの返り値を変えてテストの挙動を確認
```typescript
// モックの返り値を変更
(deps.feedRepository.findByUrl as ReturnType<typeof vi.fn>).mockResolvedValue(null); 
// → 既存フィードがない状態をシミュレート
```

---

## 🚀 実装のポイント

### ❌ よくあるミス

```typescript
// ❌ 間違い: DB空の場合でも etag/lastModified を渡している
const fetched = await this.deps.rssFetcher.fetchFeed({
  url: feed.url,
  etag: feed.etag, // ← DB空でも渡してしまう
  lastModified: feed.lastModified,
});

// ✅ 正しい: DB空なら undefined を渡す
const fetched = await this.deps.rssFetcher.fetchFeed({
  url: feed.url,
  etag: isDbEmpty ? undefined : feed.etag,
  lastModified: isDbEmpty ? undefined : feed.lastModified,
});
```

### ❌ よくあるミス2

```typescript
// ❌ 間違い: 常にインデックス作成を試みている
await this.deps.searchRepository.indexEntries(insertedEntryIds);

// ✅ 正しい: 実際に記事が保存された場合のみ
if (insertedEntryIds.length > 0) {
  await this.deps.searchRepository.indexEntries(insertedEntryIds);
}
```

---

## 📖 関連ファイル

- **実装**: [register-feed.ts](../register-feed.ts)
- **インターフェース**: [ports/index.ts](../../../ports/index.ts)
- **ドメインモデル**: [domain/entities/](../../../../domain/entities/)

---

## ❓ 困ったときは

1. **テストが RED（失敗）の場合**:
   - エラーメッセージをよく読む
   - `console.log()` で値を確認
   - モックが正しく設定されているか確認

2. **実装が複雑に感じる場合**:
   - Step 1 → Step 2 → ... と順に処理フローを追う
   - 各 Step で何をしているかコメントで説明してみる
   - 1つのテストグループだけを `describe.only()` で実行

3. **モックの使い方がわからない場合**:
   - 他のテストファイル（`mark-entry-read.test.ts` など）を参考に
   - `vi.fn()` = 関数をモック化
   - `.mockResolvedValue()` = 非同期関数の返り値を指定
   - `.mockRejectedValue()` = エラーを投げる場合は `Rejected`

