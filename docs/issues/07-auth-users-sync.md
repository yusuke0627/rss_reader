## Background
Auth.js セッションは有効だが、users テーブルとの同期ロジックが未整備。

## Scope
- サインイン時の users upsert
- email/name/image の更新方針を実装
- セッションIDとアプリユーザーの整合を担保

## Acceptance Criteria
- サインイン後、users に対応レコードが必ず存在
- 既存ユーザーの再ログイン時も破綻しない
- `npm run lint` / `npm run build` が通る
