import type {
  EntryFilter,
  EntryRepository,
  SaveFetchedEntriesInput,
} from "@/application/ports";
import type { Entry, UserEntry } from "@/domain/entities";
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

function mapUserEntry(row: Record<string, unknown>): UserEntry {
  return {
    userId: asString(row.user_id),
    entryId: asString(row.entry_id),
    isRead: asBoolean(row.is_read),
    isBookmarked: asBoolean(row.is_bookmarked),
    readAt: asNullableDate(row.read_at),
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

    if (filter.folderId) {
      conditions.push("s.folder_id = ?");
      args.push(filter.folderId);
    }

    if (filter.tagId) {
      conditions.push(
        "EXISTS (SELECT 1 FROM entry_tags et WHERE et.entry_id = e.id AND et.tag_id = ?)",
      );
      args.push(filter.tagId);
    }

    if (filter.unreadOnly) {
      conditions.push("COALESCE(ue.is_read, 0) = 0");
    }

    if (filter.bookmarkedOnly) {
      conditions.push("COALESCE(ue.is_bookmarked, 0) = 1");
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
          ue.is_read, ue.is_bookmarked
        FROM entries e
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

  async findByIdForUser(input: {
    userId: string;
    entryId: string;
  }): Promise<Entry | null> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT e.id, e.feed_id, e.guid, e.title, e.url, e.content, e.published_at, e.author, e.summary, e.image_url, e.created_at,
               ue.is_read, ue.is_bookmarked
        FROM entries e
        INNER JOIN subscriptions s ON s.feed_id = e.feed_id
        LEFT JOIN user_entry ue ON ue.entry_id = e.id AND ue.user_id = s.user_id
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
    readAt: Date;
  }): Promise<UserEntry> {
    const db = getTursoClient();
    await db.execute({
      sql: `
        INSERT INTO user_entry (user_id, entry_id, is_read, is_bookmarked, read_at)
        VALUES (?, ?, 1, 0, ?)
        ON CONFLICT(user_id, entry_id)
        DO UPDATE SET is_read = 1, read_at = excluded.read_at
      `,
      args: [input.userId, input.entryId, input.readAt.toISOString()],
    });

    return this.findUserEntry(input.userId, input.entryId);
  }

  async markAsUnread(input: {
    userId: string;
    entryId: string;
  }): Promise<UserEntry> {
    const db = getTursoClient();
    await db.execute({
      sql: `
        INSERT INTO user_entry (user_id, entry_id, is_read, is_bookmarked, read_at)
        VALUES (?, ?, 0, 0, NULL)
        ON CONFLICT(user_id, entry_id)
        DO UPDATE SET is_read = 0, read_at = NULL
      `,
      args: [input.userId, input.entryId],
    });

    return this.findUserEntry(input.userId, input.entryId);
  }

  async toggleBookmark(input: {
    userId: string;
    entryId: string;
    isBookmarked: boolean;
  }): Promise<UserEntry> {
    const db = getTursoClient();
    await db.execute({
      sql: `
        INSERT INTO user_entry (user_id, entry_id, is_read, is_bookmarked, read_at)
        VALUES (?, ?, 0, ?, NULL)
        ON CONFLICT(user_id, entry_id)
        DO UPDATE SET is_bookmarked = excluded.is_bookmarked
      `,
      args: [input.userId, input.entryId, input.isBookmarked ? 1 : 0],
    });

    return this.findUserEntry(input.userId, input.entryId);
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

  private async findUserEntry(
    userId: string,
    entryId: string,
  ): Promise<UserEntry> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT user_id, entry_id, is_read, is_bookmarked, read_at
        FROM user_entry
        WHERE user_id = ? AND entry_id = ?
        LIMIT 1
      `,
      args: [userId, entryId],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) {
      throw new Error("Failed to persist user entry state");
    }

    return mapUserEntry(row);
  }
}
