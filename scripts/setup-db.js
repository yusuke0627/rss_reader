const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function setup() {
  const dbUrl = process.env.TURSO_DATABASE_URL;
  if (!dbUrl) {
    console.error('Error: TURSO_DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  console.log(`Setting up database at: ${dbUrl}`);

  const client = createClient({
    url: dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const schemaPath = path.join(__dirname, '../src/infrastructure/db/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // libsql client doesn't support executing multiple statements (separated by ;) natively with `execute` easily in some versions.
  // We'll split the schema by ';' and execute them one by one.
  const statements = schemaSql
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);

  try {
    for (const stmt of statements) {
      console.log(`Executing: ${stmt.substring(0, 50).replace(/\n/g, ' ')}...`);
      await client.execute(stmt);
    }
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error executing schema setup:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

setup();
