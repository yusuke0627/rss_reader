import type { UserRepository } from "@/application/ports";
import type { PublicProfile, User } from "@/domain/entities";
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

function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: asString(row.id),
    email: asString(row.email),
    name: asNullableString(row.name),
    image: asNullableString(row.image),
    createdAt: asDate(row.created_at),
  };
}

function mapPublicProfile(row: Record<string, unknown>): PublicProfile {
  return {
    userId: asString(row.user_id),
    publicSlug: asString(row.public_slug),
    isPublic: asBoolean(row.is_public),
  };
}

export class TursoUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT id, email, name, image, created_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      args: [id],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? mapUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT id, email, name, image, created_at
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
      args: [email],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? mapUser(row) : null;
  }

  async create(input: {
    email: string;
    name?: string | null;
    image?: string | null;
  }): Promise<User> {
    const db = getTursoClient();
    const id = crypto.randomUUID();

    await db.execute({
      sql: `
        INSERT INTO users (id, email, name, image, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          name = COALESCE(excluded.name, users.name),
          image = COALESCE(excluded.image, users.image)
      `,
      args: [id, input.email, input.name ?? null, input.image ?? null, new Date().toISOString()],
    });

    const created = await this.findByEmail(input.email);
    if (!created) {
      throw new Error("Failed to create user");
    }
    return created;
  }

  async findPublicProfileBySlug(slug: string): Promise<PublicProfile | null> {
    const db = getTursoClient();
    const result = await db.execute({
      sql: `
        SELECT user_id, public_slug, is_public
        FROM public_profile
        WHERE public_slug = ?
        LIMIT 1
      `,
      args: [slug],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? mapPublicProfile(row) : null;
  }

  async upsertPublicProfile(input: {
    userId: string;
    publicSlug: string;
    isPublic: boolean;
  }): Promise<PublicProfile> {
    const db = getTursoClient();
    await db.execute({
      sql: `
        INSERT INTO public_profile (user_id, public_slug, is_public)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id)
        DO UPDATE SET public_slug = excluded.public_slug, is_public = excluded.is_public
      `,
      args: [input.userId, input.publicSlug, input.isPublic ? 1 : 0],
    });

    const result = await db.execute({
      sql: `
        SELECT user_id, public_slug, is_public
        FROM public_profile
        WHERE user_id = ?
        LIMIT 1
      `,
      args: [input.userId],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) {
      throw new Error("Failed to upsert public profile");
    }

    return mapPublicProfile(row);
  }
}
