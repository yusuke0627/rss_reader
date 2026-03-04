import type {
  EntryFilter,
  EntryRepository,
  SaveFetchedEntriesInput,
} from "@/application/ports";
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

 
export class TursoEntryRepository implements EntryRepository {
  async listByFilter(filter: EntryFilter): Promise<Entry[]> {
    const db = getTursoClient();
    const conditions: string[] = ["s.user_id = ?"];
    const args: Array<string | number | null> = [filter.userId];

    if (filter.feedId) {
      conditions.push("e.feed_id = ?");
      args.push(filter.feedId);
    }

    if (filter.tagId) {
      conditions.push(
        "EXISTS (SELECT 1 FROM entry_tags et WHERE et.entry_id = e.id AND et.tag_id = ?)",
      );
      args.push(filter.tagId);
    }

    if (filter.unreadOnly) {
      conditions.push(
        "NOT EXISTS (SELECT 1 FROM entry_tags et JOIN tags t ON et.tag_id = t.id WHERE et.entry_id = e.id AND t.user_id = s.user_id AND t.is_system = 1 AND t.name = 'Read')"
      );
    }

    if (filter.bookmarkedOnly) {
      conditions.push(
        "EXISTS (SELECT 1 FROM entry_tags et JOIN tags t ON et.tag_id = t.id WHERE et.entry_id = e.id AND t.user_id = s.user_id AND t.is_system = 1 AND t.name = 'Bookmark')"
      );
    }

    if (filter.search) {
      conditions.push("(e.title LIKE ? OR COALESCE(e.content, '') LIKE ?)");
      const pattern = `%${filter.search}%`;
      args.push(pattern, pattern);
    }

    const limit = filter.limit ?? 50;
    args.push(limit);

    const result = await db.execute({
      sql: `
        SELECT DISTINCT
          e.id, e.feed_id, e.guid, e.title, e.url, e.content, e.published_at, e.author, e.summary, e.image_url, e.created_at,
          EXISTS (
            SELECT 1 FROM entry_tags et 
            JOIN tags t ON et.tag_id = t.id 
            WHERE et.entry_id = e.id AND t.user_id = s.user_id AND t.is_system = 1 AND t.name = 'Read'
          ) as is_read, 
          EXISTS (
            SELECT 1 FROM entry_tags et 
            JOIN tags t ON et.tag_id = t.id 
            WHERE et.entry_id = e.id AND t.user_id = s.user_id AND t.is_system = 1 AND t.name = 'Bookmark'
          ) as is_bookmarked
        FROM entries e
        INNER JOIN subscriptions s ON s.feed_id = e.feed_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY COALESCE(e.published_at, e.created_at) DESC
        LIMIT ?
      `,
      args,
    });

    return result.rows.map((row) => mapEntry(row as Record<string, unknown>));
  }

  async findByIdForUser(input: {
    userId: string;
    entryId: string;
  }): Promise<Entry | null> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT e.id, e.feed_id, e.guid, e.title, e.url, e.content, e.published_at, e.author, e.summary, e.image_url, e.created_at,
               EXISTS (
                 SELECT 1 FROM entry_tags et 
                 JOIN tags t ON et.tag_id = t.id 
                 WHERE et.entry_id = e.id AND t.user_id = s.user_id AND t.is_system = 1 AND t.name = 'Read'
               ) as is_read,
               EXISTS (
                 SELECT 1 FROM entry_tags et 
                 JOIN tags t ON et.tag_id = t.id 
                 WHERE et.entry_id = e.id AND t.user_id = s.user_id AND t.is_system = 1 AND t.name = 'Bookmark'
               ) as is_bookmarked
        FROM entries e
        INNER JOIN subscriptions s ON s.feed_id = e.feed_id
        WHERE s.user_id = ? AND e.id = ?
        LIMIT 1
      `,
      args: [input.userId, input.entryId],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? mapEntry(row) : null;
  }

  async saveFetchedEntries(input: SaveFetchedEntriesInput): Promise<string[]> {
    const db = getTursoClient();
    const insertedIds: string[] = [];

    for (const item of input.entries) {
      const id = crypto.randomUUID();
      const result = await db.execute({
        sql: `
          INSERT INTO entries (id, feed_id, guid, title, url, content, published_at, author, summary, image_url, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
          ON CONFLICT(feed_id, guid) DO NOTHING
        `,
        args: [
          id,
          input.feedId,
          item.guid,
          item.title,
          item.url,
          item.content ?? null,
          item.publishedAt ? item.publishedAt.toISOString() : null,
          item.author ?? null,
          item.imageUrl ?? null,
          new Date().toISOString(),
        ],
      });

      if (Number(result.rowsAffected ?? 0) > 0) {
        insertedIds.push(id);
      }
    }

    return insertedIds;
  }

  async markAsRead(input: {
    userId: string;
    entryId: string;
  }): Promise<void> {
    const db = getTursoClient();
    
    // Ensure system tag 'Read' exists
    const tagResult = await db.execute({
      sql: `SELECT id FROM tags WHERE user_id = ? AND is_system = 1 AND name = 'Read' LIMIT 1`,
      args: [input.userId],
    });
    
    let tagId = tagResult.rows[0]?.id as string | undefined;
    if (!tagId) {
      tagId = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO tags (id, user_id, name, is_system) VALUES (?, ?, 'Read', 1)`,
        args: [tagId, input.userId],
      });
    }

    await db.execute({
      sql: `INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)`,
      args: [input.entryId, tagId],
    });
  }

  async markAsUnread(input: {
    userId: string;
    entryId: string;
  }): Promise<void> {
    const db = getTursoClient();
    
    const tagResult = await db.execute({
      sql: `SELECT id FROM tags WHERE user_id = ? AND is_system = 1 AND name = 'Read' LIMIT 1`,
      args: [input.userId],
    });
    
    const tagId = tagResult.rows[0]?.id as string | undefined;
    if (tagId) {
      await db.execute({
        sql: `DELETE FROM entry_tags WHERE entry_id = ? AND tag_id = ?`,
        args: [input.entryId, tagId],
      });
    }
  }

  async toggleBookmark(input: {
    userId: string;
    entryId: string;
    isBookmarked: boolean;
  }): Promise<void> {
    const db = getTursoClient();
    
    // Ensure system tag exists
    const tagResult = await db.execute({
      sql: `SELECT id FROM tags WHERE user_id = ? AND is_system = 1 AND name = 'Bookmark' LIMIT 1`,
      args: [input.userId],
    });
    
    let tagId = tagResult.rows[0]?.id as string | undefined;
    if (!tagId) {
      tagId = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO tags (id, user_id, name, is_system) VALUES (?, ?, 'Bookmark', 1)`,
        args: [tagId, input.userId],
      });
    }

    if (input.isBookmarked) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)`,
        args: [input.entryId, tagId],
      });
    } else {
      await db.execute({
        sql: `DELETE FROM entry_tags WHERE entry_id = ? AND tag_id = ?`,
        args: [input.entryId, tagId],
      });
    }
  }

  async listPublicEntriesBySlug(input: {
    slug: string;
    limit?: number;
    cursor?: string;
  }): Promise<Entry[]> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT DISTINCT
          e.id, e.feed_id, e.guid, e.title, e.url, e.content, e.published_at, e.author, e.summary, e.image_url, e.created_at
        FROM public_profile pp
        INNER JOIN subscriptions s ON s.user_id = pp.user_id
        INNER JOIN entries e ON e.feed_id = s.feed_id
        WHERE pp.public_slug = ? AND pp.is_public = 1
        ORDER BY COALESCE(e.published_at, e.created_at) DESC
        LIMIT ?
      `,
      args: [input.slug, input.limit ?? 50],
    });

    return result.rows.map((row) => mapEntry(row as Record<string, unknown>));
  }

  async updateSummary(input: {
    entryId: string;
    summary: string;
  }): Promise<Entry> {
    const db = getTursoClient();
    await db.execute({
      sql: `UPDATE entries SET summary = ? WHERE id = ?`,
      args: [input.summary, input.entryId],
    });

    const result = await db.execute({
      sql: `SELECT id, feed_id, guid, title, url, content, published_at, author, summary, image_url, created_at FROM entries WHERE id = ? LIMIT 1`,
      args: [input.entryId],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) {
      throw new Error(`Entry ${input.entryId} not found after update`);
    }

    return mapEntry(row);
  }


}
