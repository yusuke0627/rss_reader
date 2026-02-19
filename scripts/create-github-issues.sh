#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v gh >/dev/null 2>&1; then
  echo "gh is not installed"
  exit 1
fi

if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo "gh is not authenticated. Run: gh auth login"
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "git remote origin is not set. Set it first."
  exit 1
fi

create_issue() {
  local title="$1"
  local body_file="$2"
  local labels="$3"
  gh issue create --title "$title" --body-file "$body_file" --label "$labels"
}

create_issue "[Sprint] Turso Repository 実装を拡張（Folders/Tags/User/Search）" "docs/issues/01-turso-repositories.md" "feature,backend,priority:high"
create_issue "[Sprint] Entries API（GET /api/entries）実装" "docs/issues/02-entries-api.md" "feature,api,priority:high"
create_issue "[Sprint] 既読/未読/ブックマーク系 UseCase 拡張" "docs/issues/03-read-bookmark-usecases.md" "feature,api,priority:medium"
create_issue "[Sprint] Public Entries API/Page 実装" "docs/issues/04-public-entries.md" "feature,frontend,priority:medium"
create_issue "[Sprint] OPML Import/Export 実装" "docs/issues/05-opml.md" "feature,import-export,priority:medium"
create_issue "[Sprint] Cron Feed Sync 実装" "docs/issues/06-cron-sync.md" "feature,backend,priority:high"
create_issue "[Sprint] Auth.js と users テーブル同期" "docs/issues/07-auth-users-sync.md" "feature,auth,priority:medium"
create_issue "[Sprint] API エラーモデル統一とテスト基盤" "docs/issues/08-error-model-testing.md" "tech-debt,testing,priority:medium"

echo "All sprint issues created."
