# RSS Reader 開発まとめ（2026-02-19 時点）

## 1. 合意した設計方針
- クリーンアーキテクチャを採用
- 依存方向: `interface/infrastructure -> application -> domain`
- `domain` は外部依存を持たない
- `application` は `ports` 経由でのみ外部アクセス
- `interface`（`route.ts`）は UseCase 呼び出しに集中
- DI は MVP として関数注入（コンテナなし）

### 採用済みルール（明示反映）
1. `entries` は `UNIQUE(feed_id, guid)`
2. `user_entry` は `PRIMARY KEY(user_id, entry_id)`
3. `subscriptions` は `UNIQUE(user_id, feed_id)`
4. 公開取得は `public_profile.is_public = true` を前提

## 2. 現在の技術スタック
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Auth.js (NextAuth v5 beta, Google OAuth)
- Turso (libSQL / `@libsql/client`)

## 3. 実装済み内容

### 3.1 プロジェクト初期化
- Next.js + Tailwind の最小構成を作成
- `npm run lint`, `npm run build` が通る状態

### 3.2 レイヤ構成の雛形
- `src/domain`
- `src/application`
- `src/infrastructure`
- `src/interface`

### 3.3 Domain Entities
- `User`, `Feed`, `Entry`, `Folder`, `Tag`, `Subscription`, `UserEntry`
- `PublicProfile`, `EntryTag`

### 3.4 Application Ports
- `FeedRepository`
- `EntryRepository`
- `UserRepository`
- `SearchRepository`
- `OpmlService`
- `RssFetcher`

### 3.5 Use Cases
- `RegisterFeed`
- `MarkEntryRead`

### 3.6 Interface/API
- `POST /api/feeds`
- `POST /api/entries/:id/read`
- `GET/POST /api/auth/[...nextauth]`（Auth.js）

### 3.7 Infrastructure
- RSS取得: `RssFetcherHttp`
- DB実装:
  - In-memory（フォールバック）
  - Turso（本命）
- DIファクトリ:
  - Turso環境変数がある場合は Turso 実装
  - ない場合は In-memory 実装

## 4. DB関連（Turso）

### 4.1 スキーマ
- `src/infrastructure/db/schema.sql` を作成済み
- Turso へ適用済み（migration実行済み）

### 4.2 シード
- `scripts/seed-turso.mjs` を追加
- サンプルデータ投入済み
  - users: 1
  - feeds: 2
  - subscriptions: 2
  - entries: 2

### 4.3 検証
- Turso `SELECT 1` 接続確認済み
- `public_profile` と `entries` のサンプル行取得確認済み

## 5. 認証関連（Google OAuth）
- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` を `.env` で確認済み
- build時に `/api/auth/[...nextauth]` が有効であることを確認済み

## 6. 追加済み主要ファイル
- `src/auth.ts`
- `src/interface/http/use-case-factory.ts`
- `src/interface/http/auth-user.ts`
- `src/app/api/feeds/route.ts`
- `src/app/api/entries/[id]/read/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/infrastructure/db/schema.sql`
- `scripts/migrate-turso.mjs`
- `scripts/seed-turso.mjs`

## 7. 今後必要そうな情報（準備しておくと早いもの）

### 7.1 Auth / 運用情報
- 本番ドメイン（OAuthのリダイレクトURI確定用）
- 本番環境の `AUTH_*` / `TURSO_*` 配置先（Vercel等）

### 7.2 データ・仕様
- 実ユーザーと公開ポリシー
  - `public_slug` 命名ルール
  - 公開対象の絞り込み条件（全購読か一部か）
- フィード同期方針
  - Cron間隔（10/15/30分など）
  - 1回の処理件数上限

### 7.3 API仕様の詰め
- エラーレスポンス形式の統一（code/message）
- ページネーション仕様（cursor形式）
- `GET /api/entries` の検索条件優先順位

### 7.4 実装優先候補
1. Turso向け repository の残り（Folders/Tags/Search/User）
2. `GET /api/entries` 実装
3. `bookmark/unread` 系ユースケース実装
4. OPML import/export 実装
5. Cronエンドポイント（`/api/cron/fetch-feeds`）

## 8. 実行コマンド（現状）
```bash
npm run dev
npm run lint
npm run build
```

Tursoマイグレ/シード:
```bash
set -a && source .env && set +a && node scripts/migrate-turso.mjs
set -a && source .env && set +a && node scripts/seed-turso.mjs
```
