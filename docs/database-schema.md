# データベーススキーマ設計

Turso（SQLite / libSQL）を使用した RSS Reader のデータベース構造について説明します。

## ER図

```mermaid
erDiagram
    users ||--o{ subscriptions : "manages"
    users ||--o{ folders : "owns"
    users ||--o{ tags : "creates"
    users ||--o{ user_entry : "interacts"
    users ||--o| public_profile : "has"

    feeds ||--o{ subscriptions : "subscribed by"
    feeds ||--o{ entries : "contains"

    folders ||--o{ subscriptions : "categorizes"

    entries ||--o{ user_entry : "status for"
    entries ||--o{ entry_tags : "labeled by"

    tags ||--o{ entry_tags : "applied to"

    users {
        string id PK
        string email UNIQUE
        string name
        string image
        datetime created_at
    }

    feeds {
        string id PK
        string url UNIQUE
        string title
        string site_url
        string etag
        string last_modified
        datetime last_fetched_at
    }

    entries {
        string id PK
        string feed_id FK
        string guid UNIQUE_WITH_FEED
        string title
        string url
        text content
        datetime published_at
        string author
    }

    subscriptions {
        string id PK
        string user_id FK
        string feed_id FK
        string folder_id FK
    }

    user_entry {
        string user_id PK, FK
        string entry_id PK, FK
        boolean is_read
        boolean is_bookmarked
        datetime read_at
    }
```

## テーブル詳細

### 1. ユーザー管理

- **`users`**: ユーザーの基本情報。Auth.js と連携。
- **`public_profile`**: ユーザーごとの公開用スラグと公開状態の管理。

### 2. フィード・記事

- **`feeds`**: 購読対象の RSS フィード情報。`etag` や `last_modified` を保持し、差分更新をサポートします。
- **`entries`**: フィードから取得された個々の記事データ。

### 3. 個人設定・分類

- **`subscriptions`**: どのユーザーがどのフィードをどのフォルダに入れているか。
- **`folders`**: フィードを整理するためのユーザー定義フォルダ。
- **`tags`**: 記事に付与できるユーザー定義タグ。

### 4. ユーザーアクション

- **`user_entry`**: 記事ごとの既読・未読、ブックマーク状態。
- **`entry_tags`**: 記事とタグの多対多リレーション。

### 5. 高速検索

- **`entries_fts`**: SQLite FTS5 を使用した全文検索用仮想テーブル。

---

詳細は [schema.sql](../src/infrastructure/db/schema.sql) を参照してください。
