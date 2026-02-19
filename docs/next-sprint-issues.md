# Next Sprint Issues

## Issue 1: Turso Repository 実装を拡張（Folders/Tags/User/Search）
- Type: Feature
- Priority: High
- Background: 現在は Feed/Entry のみ Turso 実装済み。残りのポート実装が未完。
- Scope:
  - `UserRepository` の Turso 実装
  - Folder/Tag 取得・作成・削除に必要な repository 実装
  - `SearchRepository`（FTS5利用）の Turso 実装
- Acceptance Criteria:
  - `application/ports` の該当インターフェースが Turso 実装で満たされる
  - in-memory フォールバック構成を維持
  - `npm run lint` / `npm run build` が通る

## Issue 2: Entries API（GET /api/entries）実装
- Type: Feature
- Priority: High
- Background: 閲覧系の中心APIが未実装。
- Scope:
  - `GET /api/entries?feedId=&folderId=&tagId=&unread=1&search=`
  - Application UseCase `SearchEntries` を追加
  - route handler は UseCase 呼び出しのみ
- Acceptance Criteria:
  - クエリ条件で絞り込みが動作
  - 認証済みユーザーのみアクセス可
  - レスポンス形式を統一（最低 `error.message` 互換）

## Issue 3: 既読/未読/ブックマーク系 UseCase を拡張
- Type: Feature
- Priority: Medium
- Background: `MarkEntryRead` は実装済みだが、他操作が未整備。
- Scope:
  - `MarkEntryUnread`
  - `ToggleBookmark`（bookmark/unbookmark）
  - API:
    - `POST /api/entries/:id/unread`
    - `POST /api/entries/:id/bookmark`
    - `POST /api/entries/:id/unbookmark`
- Acceptance Criteria:
  - `user_entry` の PK(`user_id`,`entry_id`)前提で冪等動作
  - 未購読entryの操作は 404/403 方針に従って拒否

## Issue 4: Public Entries API/Page 実装
- Type: Feature
- Priority: Medium
- Background: 公開プロフィール機能の主要ユースケース。
- Scope:
  - `GetPublicEntries` UseCase
  - `GET /public/:slug` 表示
  - 判定条件: `public_profile.is_public = true`
- Acceptance Criteria:
  - 非公開/未存在slugは適切に404
  - 公開対象ユーザーの購読feedから記事一覧を表示

## Issue 5: OPML Import/Export 実装
- Type: Feature
- Priority: Medium
- Background: MVP要求に含まれているが未実装。
- Scope:
  - `ImportOpml` / `ExportOpml` UseCase
  - `POST /api/opml/import`, `GET /api/opml/export`
  - `OpmlService` 実装（parse/build）
- Acceptance Criteria:
  - import時に重複購読を作らない（`UNIQUE(user_id, feed_id)`前提）
  - exportで現在購読をOPMLとして返せる

## Issue 6: Cron Feed Sync 実装
- Type: Feature
- Priority: High
- Background: 自動同期が未実装。
- Scope:
  - `SyncFeed` UseCase
  - `GET/POST /api/cron/fetch-feeds`
  - stale feed 抽出（`last_fetched_at ASC`, null優先）と上限件数制御
- Acceptance Criteria:
  - ETag/Last-Modified を利用した差分取得
  - `feed_id + guid` で重複排除
  - 実行ログに処理件数（対象feed数/追加entry数）を出力

## Issue 7: Auth.js と users テーブル同期
- Type: Feature
- Priority: Medium
- Background: 現在のセッションID利用だけでは users レコード同期が不足。
- Scope:
  - 初回ログイン時に users upsert
  - email/name/image の更新方針を決定
- Acceptance Criteria:
  - サインイン後、usersテーブルに必ず対応レコードが存在
  - `requireUserId` だけでなく app側の user 解決が安定動作

## Issue 8: API エラーモデルとテスト基盤
- Type: Tech Debt
- Priority: Medium
- Background: APIごとにエラー形式が揺れるリスクがある。
- Scope:
  - エラーレスポンス形式を統一（例: `code`, `message`）
  - route handler の最小テスト追加（正常系/異常系）
- Acceptance Criteria:
  - 主要APIで共通フォーマットを返す
  - 最低限の回帰テストが追加される

## Sprint Goal（提案）
- Goal A: Turso本実装で `feeds` と `entries` の read/write が安定稼働
- Goal B: ユーザーが「購読追加→一覧取得→既読/ブクマ」まで完結できる
- Goal C: 次スプリントで Cron と OPML に着手できる土台を完成
