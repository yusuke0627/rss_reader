#!/usr/bin/env node
// rss_reader/scripts/reset_turso_schema.js
// 使い方（例）:
// TURSO_DATABASE_URL="https://..." TURSO_AUTH_TOKEN="..." node rss_reader/scripts/reset_turso_schema.js
//
// 注意: 実行すると全てのテーブル/ビュー/トリガー/インデックスが削除されます。必ず事前にバックアップを取得してください。
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in environment");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  // 1) ユーザーに再確認
  console.log("!!! WARNING: This will DROP ALL user tables/views/triggers/indexes in the database !!!");
  console.log("Make sure you have a backup. Type 'yes' to continue:");
  process.stdin.setEncoding("utf8");
  const answer = await new Promise((resolve) => {
    process.stdin.once("data", (d) => resolve(d.toString().trim()));
  });
  if (answer !== "yes") {
    console.log("Aborted by user.");
    process.exit(0);
  }

  try {
    // 2) 外部キー制約をオフにする
    await client.execute({ sql: "PRAGMA foreign_keys = OFF;" });

    // 3) sqlite_master から対象オブジェクトを取得（sqlite_ で始まる内部オブジェクトは除外）
    const res = await client.execute({
      sql: `
        SELECT type, name
        FROM sqlite_master
        WHERE name NOT LIKE 'sqlite_%'
          AND type IN ('table','view','index','trigger')
        ORDER BY type = 'trigger' DESC, type = 'view' DESC, type = 'index' DESC, type = 'table' DESC;
      `,
    });

    const rows = res.rows || [];
    // rows は各行が object map で返る場合と配列で返る場合があるため汎用的に扱う
    function getValue(row, colName) {
      if (Array.isArray(row)) {
        // libsql の古いバージョンだと配列で返るかも。ここは SQL の select 順に合わせて推測が必要だが、
        // 上のクエリは 2 カラムなので row[0]=type, row[1]=name の可能性が高い。
        return row;
      }
      return row;
    }

    // npm の @libsql/client は execute の戻りが { rows: Array<Record<string, any>> } なので通常は問題なし
    // ここでは rows をそのまま利用する前提で処理
    const objects = (rows || []).map((r) => {
      // try to normalize
      if (Array.isArray(r)) {
        return { type: r[0], name: r[1] };
      }
      // r may be object like { type: 'table', name: 'entries' }
      return { type: r.type, name: r.name };
    });

    // 分類：まず TRIGGER -> VIEW -> INDEX -> TABLE の順で drop する
    const triggers = objects.filter((o) => o.type === "trigger").map((o) => o.name);
    const views = objects.filter((o) => o.type === "view").map((o) => o.name);
    const indexes = objects.filter((o) => o.type === "index").map((o) => o.name);
    const tables = objects.filter((o) => o.type === "table").map((o) => o.name);

    console.log("Found objects to drop:", {
      triggersCount: triggers.length,
      viewsCount: views.length,
      indexesCount: indexes.length,
      tablesCount: tables.length,
    });

    // 関数：順に DROP
    for (const trig of triggers) {
      const sql = `DROP TRIGGER IF EXISTS "${trig}";`;
      console.log("Dropping trigger:", trig);
      await client.execute({ sql });
    }
    for (const v of views) {
      const sql = `DROP VIEW IF EXISTS "${v}";`;
      console.log("Dropping view:", v);
      await client.execute({ sql });
    }
    for (const idx of indexes) {
      const sql = `DROP INDEX IF EXISTS "${idx}";`;
      console.log("Dropping index:", idx);
      await client.execute({ sql });
    }
    for (const t of tables) {
      const sql = `DROP TABLE IF EXISTS "${t}";`;
      console.log("Dropping table:", t);
      await client.execute({ sql });
    }

    // 4) 外部キーを戻す
    await client.execute({ sql: "PRAGMA foreign_keys = ON;" });

    // 5) schema.sql を読み込んで適用
    const schemaPath = path.join(__dirname, "..", "src", "infrastructure", "db", "schema.sql");
    if (!fs.existsSync(schemaPath)) {
      throw new Error("schema.sql not found at: " + schemaPath);
    }
    const raw = fs.readFileSync(schemaPath, "utf8");

    // 単純にセミコロンで split して実行（複雑な SQL 内に ; が含まれるケースを想定しない）
    const statements = raw
      .split(/;\s*(?:\r?\n|$)/)
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`Applying ${statements.length} statements from schema.sql...`);
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Applying statement ${i + 1}/${statements.length}: ${stmt.split("\n")[0].slice(0, 200)}`);
      await client.execute({ sql: stmt });
    }

    console.log("Reset and schema apply completed successfully.");
  } catch (err) {
    console.error("Error during reset:", err);
    process.exitCode = 2;
  } finally {
    // client.close may not be provided; ignoring explicit close
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
