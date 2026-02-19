import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url, authToken });

const now = new Date().toISOString();

const userId = "11111111-1111-4111-8111-111111111111";
const feedTechId = "22222222-2222-4222-8222-222222222222";
const feedNewsId = "33333333-3333-4333-8333-333333333333";
const folderId = "44444444-4444-4444-8444-444444444444";
const tagId = "55555555-5555-4555-8555-555555555555";
const subTechId = "66666666-6666-4666-8666-666666666666";
const subNewsId = "77777777-7777-4777-8777-777777777777";
const entry1Id = "88888888-8888-4888-8888-888888888881";
const entry2Id = "88888888-8888-4888-8888-888888888882";

await client.execute({
  sql: `
    INSERT OR IGNORE INTO users (id, email, name, image, created_at)
    VALUES (?, ?, ?, ?, ?)
  `,
  args: [userId, "demo@example.com", "Demo User", null, now],
});

await client.execute({
  sql: `
    INSERT OR IGNORE INTO public_profile (user_id, public_slug, is_public)
    VALUES (?, ?, 1)
  `,
  args: [userId, "demo"],
});

await client.execute({
  sql: `
    INSERT OR IGNORE INTO folders (id, user_id, name)
    VALUES (?, ?, ?)
  `,
  args: [folderId, userId, "Tech"],
});

await client.execute({
  sql: `
    INSERT OR IGNORE INTO tags (id, user_id, name)
    VALUES (?, ?, ?)
  `,
  args: [tagId, userId, "important"],
});

await client.execute({
  sql: `
    INSERT OR IGNORE INTO feeds
      (id, url, title, site_url, etag, last_modified, last_fetched_at)
    VALUES (?, ?, ?, ?, NULL, NULL, ?)
  `,
  args: [
    feedTechId,
    "https://example.com/tech/feed.xml",
    "Example Tech",
    "https://example.com/tech",
    now,
  ],
});

await client.execute({
  sql: `
    INSERT OR IGNORE INTO feeds
      (id, url, title, site_url, etag, last_modified, last_fetched_at)
    VALUES (?, ?, ?, ?, NULL, NULL, ?)
  `,
  args: [
    feedNewsId,
    "https://example.com/news/feed.xml",
    "Example News",
    "https://example.com/news",
    now,
  ],
});

await client.execute({
  sql: `
    INSERT OR IGNORE INTO subscriptions (id, user_id, feed_id, folder_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `,
  args: [subTechId, userId, feedTechId, folderId, now],
});

await client.execute({
  sql: `
    INSERT OR IGNORE INTO subscriptions (id, user_id, feed_id, folder_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `,
  args: [subNewsId, userId, feedNewsId, null, now],
});

await client.execute({
  sql: `
    INSERT OR IGNORE INTO entries
      (id, feed_id, guid, title, url, content, published_at, author, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  args: [
    entry1Id,
    feedTechId,
    "tech-001",
    "Clean Architecture in RSS Readers",
    "https://example.com/tech/clean-architecture",
    "How to apply layered architecture to an RSS product.",
    now,
    "Demo Author",
    now,
  ],
});

await client.execute({
  sql: `
    INSERT OR IGNORE INTO entries
      (id, feed_id, guid, title, url, content, published_at, author, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  args: [
    entry2Id,
    feedNewsId,
    "news-001",
    "Turso + Next.js integration notes",
    "https://example.com/news/turso-nextjs",
    "A practical guide to wire repositories with Turso.",
    now,
    "Editor",
    now,
  ],
});

await client.execute({
  sql: `
    INSERT OR IGNORE INTO user_entry
      (user_id, entry_id, is_read, is_bookmarked, read_at)
    VALUES (?, ?, 1, 1, ?)
  `,
  args: [userId, entry1Id, now],
});

await client.execute({
  sql: `
    INSERT OR IGNORE INTO entry_tags (entry_id, tag_id)
    VALUES (?, ?)
  `,
  args: [entry1Id, tagId],
});

await client.execute({
  sql: `
    INSERT OR IGNORE INTO entries_fts (entry_id, title, content, feed_title)
    VALUES (?, ?, ?, ?)
  `,
  args: [entry1Id, "Clean Architecture in RSS Readers", "How to apply layered architecture to an RSS product.", "Example Tech"],
});

await client.execute({
  sql: `
    INSERT OR IGNORE INTO entries_fts (entry_id, title, content, feed_title)
    VALUES (?, ?, ?, ?)
  `,
  args: [entry2Id, "Turso + Next.js integration notes", "A practical guide to wire repositories with Turso.", "Example News"],
});

const [users, feeds, subs, entries] = await Promise.all([
  client.execute("SELECT COUNT(*) AS c FROM users"),
  client.execute("SELECT COUNT(*) AS c FROM feeds"),
  client.execute("SELECT COUNT(*) AS c FROM subscriptions"),
  client.execute("SELECT COUNT(*) AS c FROM entries"),
]);

console.log(
  "seed_done",
  {
    users: Number(users.rows[0].c),
    feeds: Number(feeds.rows[0].c),
    subscriptions: Number(subs.rows[0].c),
    entries: Number(entries.rows[0].c),
  },
);
