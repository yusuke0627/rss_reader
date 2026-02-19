import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function isTursoConfigured(): boolean {
  // 2つ揃っているときだけ Turso 実装を有効化する。
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

export function getTursoClient(): Client {
  if (!isTursoConfigured()) {
    throw new Error("Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.");
  }

  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }

  return client;
}
