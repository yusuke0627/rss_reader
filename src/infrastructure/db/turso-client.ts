import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function isTursoConfigured(): boolean {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return false;
  // Local file URLs don't need auth tokens
  if (url.startsWith("file:")) return true;
  // Remote URLs require both URL and Auth Token
  return Boolean(process.env.TURSO_AUTH_TOKEN);
}

export function getTursoClient(): Client {
  if (!isTursoConfigured()) {
    throw new Error("Turso Database URL is not configured. Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN if remote).");
  }

  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });
  }

  return client;
}
