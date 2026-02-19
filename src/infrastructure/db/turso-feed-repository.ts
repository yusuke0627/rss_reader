import type {
  CreateFeedInput,
  FeedRepository,
  UpsertFeedMetadataInput,
} from "@/application/ports";
import type { Feed, Subscription } from "@/domain/entities";
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

function mapFeed(row: Record<string, unknown>): Feed {
  return {
    id: asString(row.id),
    url: asString(row.url),
    title: asString(row.title),
    siteUrl: asNullableString(row.site_url),
    etag: asNullableString(row.etag),
    lastModified: asNullableString(row.last_modified),
    lastFetchedAt: asNullableDate(row.last_fetched_at),
  };
}

function mapSubscription(row: Record<string, unknown>): Subscription {
  return {
    id: asString(row.id),
    userId: asString(row.user_id),
    feedId: asString(row.feed_id),
    folderId: asNullableString(row.folder_id),
    createdAt: asDate(row.created_at),
  };
}

export class TursoFeedRepository implements FeedRepository {
  async findById(id: string): Promise<Feed | null> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT id, url, title, site_url, etag, last_modified, last_fetched_at
        FROM feeds
        WHERE id = ?
        LIMIT 1
      `,
      args: [id],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? mapFeed(row) : null;
  }

  async findByUrl(url: string): Promise<Feed | null> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT id, url, title, site_url, etag, last_modified, last_fetched_at
        FROM feeds
        WHERE url = ?
        LIMIT 1
      `,
      args: [url],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? mapFeed(row) : null;
  }

  async create(input: CreateFeedInput): Promise<Feed> {
    const db = getTursoClient();
    const id = crypto.randomUUID();

    await db.execute({
      sql: `
        INSERT INTO feeds (id, url, title, site_url, etag, last_modified, last_fetched_at)
        VALUES (?, ?, ?, ?, NULL, NULL, NULL)
      `,
      args: [id, input.url, input.title, input.siteUrl ?? null],
    });

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to create feed");
    }
    return created;
  }

  async deleteById(id: string): Promise<void> {
    const db = getTursoClient();
    await db.execute({
      sql: `DELETE FROM feeds WHERE id = ?`,
      args: [id],
    });
  }

  async listByUserId(userId: string): Promise<Feed[]> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT f.id, f.url, f.title, f.site_url, f.etag, f.last_modified, f.last_fetched_at
        FROM feeds f
        INNER JOIN subscriptions s ON s.feed_id = f.id
        WHERE s.user_id = ?
        ORDER BY f.title ASC
      `,
      args: [userId],
    });

    return result.rows.map((row) => mapFeed(row as Record<string, unknown>));
  }

  async createSubscription(input: {
    userId: string;
    feedId: string;
    folderId?: string | null;
  }): Promise<Subscription> {
    const db = getTursoClient();
    const id = crypto.randomUUID();

    await db.execute({
      sql: `
        INSERT INTO subscriptions (id, user_id, feed_id, folder_id, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, feed_id)
        DO UPDATE SET folder_id = COALESCE(excluded.folder_id, subscriptions.folder_id)
      `,
      args: [id, input.userId, input.feedId, input.folderId ?? null, new Date().toISOString()],
    });

    const result = await db.execute({
      sql: `
        SELECT id, user_id, feed_id, folder_id, created_at
        FROM subscriptions
        WHERE user_id = ? AND feed_id = ?
        LIMIT 1
      `,
      args: [input.userId, input.feedId],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) {
      throw new Error("Failed to create subscription");
    }

    return mapSubscription(row);
  }

  async deleteSubscription(input: { userId: string; feedId: string }): Promise<void> {
    const db = getTursoClient();
    await db.execute({
      sql: `DELETE FROM subscriptions WHERE user_id = ? AND feed_id = ?`,
      args: [input.userId, input.feedId],
    });
  }

  async updateSubscriptionFolder(input: {
    userId: string;
    feedId: string;
    folderId: string | null;
  }): Promise<void> {
    const db = getTursoClient();
    await db.execute({
      sql: `
        UPDATE subscriptions
        SET folder_id = ?
        WHERE user_id = ? AND feed_id = ?
      `,
      args: [input.folderId, input.userId, input.feedId],
    });
  }

  async listStaleFeeds(limit: number): Promise<Feed[]> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT id, url, title, site_url, etag, last_modified, last_fetched_at
        FROM feeds
        ORDER BY CASE WHEN last_fetched_at IS NULL THEN 0 ELSE 1 END ASC, last_fetched_at ASC
        LIMIT ?
      `,
      args: [limit],
    });

    return result.rows.map((row) => mapFeed(row as Record<string, unknown>));
  }

  async updateFetchMetadata(input: UpsertFeedMetadataInput): Promise<void> {
    const db = getTursoClient();
    await db.execute({
      sql: `
        UPDATE feeds
        SET etag = ?, last_modified = ?, last_fetched_at = ?
        WHERE id = ?
      `,
      args: [
        input.etag ?? null,
        input.lastModified ?? null,
        input.lastFetchedAt.toISOString(),
        input.feedId,
      ],
    });
  }
}
