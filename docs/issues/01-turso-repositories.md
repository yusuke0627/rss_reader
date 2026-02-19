## Background
Feed/Entry 以外の repository が Turso 実装になっておらず、永続化層が未完成。

## Scope
- `UserRepository` の Turso 実装
- Folder/Tag repository 実装（一覧/作成/削除）
- `SearchRepository`（FTS5）実装
- DI で Turso 実装を使うように接続

## Acceptance Criteria
- `application/ports` の該当インターフェースを満たす
- `npm run lint` / `npm run build` が通る
- in-memory fallback を維持
