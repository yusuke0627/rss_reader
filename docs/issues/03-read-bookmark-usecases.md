## Background
`MarkEntryRead` はあるが、未読戻しとブックマーク系が未実装。

## Scope
- `MarkEntryUnread` UseCase
- `ToggleBookmark` UseCase
- API追加:
  - `POST /api/entries/:id/unread`
  - `POST /api/entries/:id/bookmark`
  - `POST /api/entries/:id/unbookmark`

## Acceptance Criteria
- `PRIMARY KEY(user_id, entry_id)` 前提で冪等更新できる
- 非購読entryへの操作を拒否
- `npm run lint` / `npm run build` が通る
