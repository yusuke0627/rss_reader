## Background
公開ページ要件はあるが実装未着手。

## Scope
- `GetPublicEntries` UseCase 追加
- `GET /public/:slug` 実装
- `public_profile.is_public = true` 条件で公開判定

## Acceptance Criteria
- 非公開・存在しない slug は 404
- 該当ユーザーの購読feed記事を返す
- `npm run lint` / `npm run build` が通る
