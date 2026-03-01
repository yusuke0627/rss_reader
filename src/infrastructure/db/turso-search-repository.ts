import type { SearchEntriesInput, SearchRepository } from "@/application/ports";
import type { Entry } from "@/domain/entities";
import { getTursoClient } from "./turso-client";

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  return typeof value === "string" ? value : String(value);
}

function asDate(value: unknown): Date {
  return new Date(asString(value));
}

function asNullableDate(value: unknown): Date | null {
  if (!value) return null;
  return new Date(asString(value));
}

function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function mapEntry(row: Record<string, unknown>): Entry {
  return {
    id: asString(row.id),
    feedId: asString(row.feed_id),
    guid: asString(row.guid),
    title: asString(row.title),
    url: asString(row.url),
    content: asNullableString(row.content),
    publishedAt: asNullableDate(row.published_at),
    author: asNullableString(row.author),
    summary: asNullableString(row.summary),
    imageUrl: asNullableString(row.image_url),
    createdAt: asDate(row.created_at),
    isRead: row.is_read !== undefined ? asBoolean(row.is_read) : undefined,
    isBookmarked:
      row.is_bookmarked !== undefined ? asBoolean(row.is_bookmarked) : undefined,
  };
}

export class TursoSearchRepository implements SearchRepository {
  async searchEntries(input: SearchEntriesInput): Promise<Entry[]> {
    const db = getTursoClient();

    const conditions: string[] = ["entries_fts MATCH ?", "s.user_id = ?"];

    const ftsQuery = input.query
      .trim()
      .split(/\s+/)
      .map((term) => `${term}*`)
      .join(" ");
    const args: Array<string | number> = [ftsQuery, input.userId];

    if (input.feedId) {
      conditions.push("e.feed_id = ?");
      args.push(input.feedId);
    }

    if (input.folderId) {
      conditions.push("s.folder_id = ?");
      args.push(input.folderId);
    }

    if (input.tagId) {
      conditions.push(
        "EXISTS (SELECT 1 FROM entry_tags et WHERE et.entry_id = e.id AND et.tag_id = ?)",
      );
      args.push(input.tagId);
    }

    if (input.unreadOnly) {
      conditions.push("COALESCE(ue.is_read, 0) = 0");
    }

    args.push(input.limit ?? 50);

    const result = await db.execute({
      sql: `
        SELECT DISTINCT
          e.id, e.feed_id, e.guid, e.title, e.url, e.content, e.published_at, e.author, e.summary, e.image_url, e.created_at
        FROM entries_fts fts
        INNER JOIN entries e ON e.id = fts.entry_id
        INNER JOIN subscriptions s ON s.feed_id = e.feed_id
        LEFT JOIN user_entry ue ON ue.entry_id = e.id AND ue.user_id = s.user_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY COALESCE(e.published_at, e.created_at) DESC
        LIMIT ?
      `,
      args,
    });

    return result.rows.map((row) => mapEntry(row as Record<string, unknown>));
  }

  async indexEntries(entryIds: string[]): Promise<void> {
    if (entryIds.length === 0) {
      return;
    }

    const db = getTursoClient();

    for (const entryId of entryIds) {
      await db.execute({
        sql: `DELETE FROM entries_fts WHERE entry_id = ?`,
        args: [entryId],
      });

      await db.execute({
        sql: `
          INSERT INTO entries_fts (entry_id, title, content, feed_title)
          SELECT e.id, e.title, COALESCE(e.content, ''), COALESCE(f.title, '')
          FROM entries e
          INNER JOIN feeds f ON f.id = e.feed_id
          WHERE e.id = ?
        `,
        args: [entryId],
      });
    }
  }
}
