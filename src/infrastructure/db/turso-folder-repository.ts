import type { FolderRepository } from "@/application/ports";
import type { Folder } from "@/domain/entities";
import { getTursoClient } from "./turso-client";

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function mapFolder(row: Record<string, unknown>): Folder {
  return {
    id: asString(row.id),
    userId: asString(row.user_id),
    name: asString(row.name),
  };
}

export class TursoFolderRepository implements FolderRepository {
  async listByUserId(userId: string): Promise<Folder[]> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT id, user_id, name
        FROM folders
        WHERE user_id = ?
        ORDER BY name ASC
      `,
      args: [userId],
    });

    return result.rows.map((row) => mapFolder(row as Record<string, unknown>));
  }

  async findByIdForUser(input: { userId: string; folderId: string }): Promise<Folder | null> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT id, user_id, name
        FROM folders
        WHERE user_id = ? AND id = ?
        LIMIT 1
      `,
      args: [input.userId, input.folderId],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? mapFolder(row) : null;
  }

  async create(input: { userId: string; name: string }): Promise<Folder> {
    const db = getTursoClient();
    const id = crypto.randomUUID();
    await db.execute({
      sql: `
        INSERT INTO folders (id, user_id, name)
        VALUES (?, ?, ?)
      `,
      args: [id, input.userId, input.name],
    });

    const folder = await this.findByIdForUser({ userId: input.userId, folderId: id });
    if (!folder) {
      throw new Error("Failed to create folder");
    }
    return folder;
  }

  async delete(input: { userId: string; folderId: string }): Promise<void> {
    const db = getTursoClient();
    await db.execute({
      sql: `
        DELETE FROM folders
        WHERE user_id = ? AND id = ?
      `,
      args: [input.userId, input.folderId],
    });
  }
}
