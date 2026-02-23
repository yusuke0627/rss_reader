import type { TagRepository } from "@/application/ports";
import type { Tag } from "@/domain/entities";
import { getTursoClient } from "./turso-client";

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function mapTag(row: Record<string, unknown>): Tag {
  return {
    id: asString(row.id),
    userId: asString(row.user_id),
    name: asString(row.name),
  };
}

export class TursoTagRepository implements TagRepository {
  async listByUserId(userId: string): Promise<Tag[]> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT id, user_id, name
        FROM tags
        WHERE user_id = ?
        ORDER BY name ASC
      `,
      args: [userId],
    });

    return result.rows.map((row) => mapTag(row as Record<string, unknown>));
  }

  async findByIdForUser(input: {
    userId: string;
    tagId: string;
  }): Promise<Tag | null> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT id, user_id, name
        FROM tags
        WHERE user_id = ? AND id = ?
        LIMIT 1
      `,
      args: [input.userId, input.tagId],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? mapTag(row) : null;
  }

  async create(input: { userId: string; name: string }): Promise<Tag> {
    const db = getTursoClient();
    const id = crypto.randomUUID();
    await db.execute({
      sql: `
        INSERT INTO tags (id, user_id, name)
        VALUES (?, ?, ?)
      `,
      args: [id, input.userId, input.name],
    });

    const tag = await this.findByIdForUser({ userId: input.userId, tagId: id });
    if (!tag) {
      throw new Error("Failed to create tag");
    }
    return tag;
  }

  async delete(input: { userId: string; tagId: string }): Promise<void> {
    const db = getTursoClient();
    await db.execute({
      sql: `
        DELETE FROM tags
        WHERE user_id = ? AND id = ?
      `,
      args: [input.userId, input.tagId],
    });
  }

  // 記事にtagをつける
  async addToEntry(input: { entryId: string; tagId: string }): Promise<void> {
    const db = getTursoClient();
    await db.execute({
      sql: `
        INSERT OR IGNORE INTO entry_tags (entry_id, tag_id)
        VALUES (?, ?)
      `,
      args: [input.entryId, input.tagId],
    });
  }

  // 記事からtagを外す
  async removeFromEntry(input: {
    entryId: string;
    tagId: string;
  }): Promise<void> {
    const db = getTursoClient();
    await db.execute({
      sql: `
        DELETE FROM entry_tags
        WHERE entry_id = ? AND tag_id = ?
      `,
      args: [input.entryId, input.tagId],
    });
  }

  // 記事に基づくtagの一覧
  async listByEntryId(input: {
    entryId: string;
    userId: string;
  }): Promise<Tag[]> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
      SELECT t.id, t.user_id, t.name
      FROM tags t
      JOIN entry_tags et ON t.id = et.tag_id
      WHERE et.entry_id = ? AND t.user_id = ?
      ORDER BY t.name ASC
      `,
      args: [input.entryId, input.userId],
    });

    return result.rows.map((row) => mapTag(row as Record<string, unknown>));
  }
}
