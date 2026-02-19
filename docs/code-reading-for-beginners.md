# Next.js + クリーンアーキテクチャ初心者向けコードリーディングガイド

このドキュメントは「どこから読めば迷わないか」を目的にしています。

## 0. まず前提（このプロジェクトの依存方向）
- `interface` / `app`（UI・HTTP）
- `application`（ユースケース）
- `domain`（型・ビジネスの中心）
- `infrastructure`（DB/外部API実装）

依存は **外側 -> 内側** です。
`application` は具体実装（Turso/HTTP）を知らず、`ports` だけに依存します。

## 1. 最短で全体像を掴む読み順
1. `/Users/arakaki/dev/rss_reader/src/app/page.tsx`
2. `/Users/arakaki/dev/rss_reader/src/interface/ui/components/home-client.tsx`
3. `/Users/arakaki/dev/rss_reader/src/app/api/feeds/route.ts`
4. `/Users/arakaki/dev/rss_reader/src/interface/http/use-case-factory.ts`
5. `/Users/arakaki/dev/rss_reader/src/application/use-cases/register-feed.ts`
6. `/Users/arakaki/dev/rss_reader/src/application/ports/*.ts`
7. `/Users/arakaki/dev/rss_reader/src/infrastructure/db/repository-factory.ts`
8. `/Users/arakaki/dev/rss_reader/src/infrastructure/db/turso-*.ts`

この順で読むと、
「UI -> API -> UseCase -> Port -> 実装」の流れが一周できます。

## 2. ルーティング層（Next.js App Router）の見方
- APIは `src/app/api/**/route.ts`
- 役割は「入力受け取り・バリデーション・UseCase呼び出し・HTTPレスポンス変換」
- ビジネス判断は route に書かず UseCase へ寄せる

注目ファイル:
- `/Users/arakaki/dev/rss_reader/src/app/api/feeds/route.ts`
- `/Users/arakaki/dev/rss_reader/src/app/api/entries/route.ts`

## 3. UseCase（application）の見方
UseCase は「1機能の業務フロー」です。

例:
- `RegisterFeed`: URL検証 -> フィード取得 -> feed/subscription保存 -> entries保存
- `MarkEntryRead`: 対象entryが自分に見えるか確認 -> 既読化

注目ファイル:
- `/Users/arakaki/dev/rss_reader/src/application/use-cases/register-feed.ts`
- `/Users/arakaki/dev/rss_reader/src/application/use-cases/mark-entry-read.ts`
- `/Users/arakaki/dev/rss_reader/src/application/use-cases/search-entries.ts`

## 4. Ports（application/ports）の見方
Ports は「UseCaseが期待する機能のインターフェース」です。

ここに具体実装は書かれません。
例えば `FeedRepository` が「何をできるべきか」だけを定義します。

注目ファイル:
- `/Users/arakaki/dev/rss_reader/src/application/ports/feed-repository.ts`
- `/Users/arakaki/dev/rss_reader/src/application/ports/entry-repository.ts`
- `/Users/arakaki/dev/rss_reader/src/application/ports/user-repository.ts`

## 5. Infrastructure（実装）の見方
同じ Port に対して実装が複数あります。

- Turso実装: `turso-*.ts`
- 開発用 in-memory 実装: `in-memory-*.ts`
- 切替は `repository-factory.ts`

注目ファイル:
- `/Users/arakaki/dev/rss_reader/src/infrastructure/db/repository-factory.ts`
- `/Users/arakaki/dev/rss_reader/src/infrastructure/db/turso-entry-repository.ts`
- `/Users/arakaki/dev/rss_reader/src/infrastructure/rss/rss-fetcher-http.ts`

## 6. 認証周りの見方
- Auth.js 設定: `/Users/arakaki/dev/rss_reader/src/auth.ts`
- API側の認証ゲート: `/Users/arakaki/dev/rss_reader/src/interface/http/auth-user.ts`

`requireUserId()` は現在、セッション確認だけでなく users テーブルへの upsert も担当します。
（外部キー制約違反を防ぐため）

## 7. よくある混乱ポイント
- route.ts に業務ロジックを書きすぎる
- UseCase が直接 Turso を呼ぶ（ports違反）
- domain に zod や next 依存を入れてしまう
- フィルタや検索の責務が route と repository で重複する

## 8. 実際に追うべきデバッグ手順
例: フィード登録で500になるとき
1. routeの `catch` で `detail` を確認
2. `RegisterFeed` のどこで落ちるか（fetch/save/subscription）を特定
3. `Turso*Repository` の SQL と制約を確認
4. 依存注入が意図どおり Turso実装を使っているか確認

## 9. 学習の次ステップ
1. `Issue #6`（Cron同期）で UseCase -> Port -> Turso 実装の追加を体験
2. `Issue #7`（Auth users同期）を読む・改善する
3. APIエラー形式統一（`code/message`）で route層の設計を揃える
