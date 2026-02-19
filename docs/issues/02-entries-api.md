## Background
一覧取得の中核となる `GET /api/entries` が未実装。

## Scope
- `SearchEntries` UseCase 追加
- `GET /api/entries?feedId=&folderId=&tagId=&unread=1&search=` 実装
- 認証済みユーザーのみアクセス可

## Acceptance Criteria
- 各クエリ条件で期待どおりに絞り込みできる
- エラー形式が既存APIと整合
- `npm run lint` / `npm run build` が通る
