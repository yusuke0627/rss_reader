## Background
APIごとにエラー形式が揺れると運用・フロント接続のコストが増える。

## Scope
- エラーレスポンス共通化（例: `code`, `message`）
- route handler の最小テスト追加（正常系/異常系）

## Acceptance Criteria
- 対象APIでエラー形式が統一される
- 主要ルートの回帰テストが動く
- `npm run lint` / `npm run build` が通る
