## Background
定期同期（Cron）が未実装で、フィード更新が手動に依存している。

## Scope
- `SyncFeed` UseCase
- `POST /api/cron/fetch-feeds` 実装
- stale feed を `last_fetched_at` 昇順（NULL優先）で取得
- 件数上限を設けてバッチ実行

## Acceptance Criteria
- ETag/Last-Modified を使った差分取得が動作
- `UNIQUE(feed_id, guid)` で重複排除
- 実行結果（対象feed数、追加entry数）をログ出力
