// Run a db/*.sql migration against Supabase using the SUPABASE_DB_URL
// connection string in .env.local (gitignored). Usage:
//   node scripts/run-migration.mjs db/2026-07-04_client_monthly_amount.sql
//
// Safety: refuses to run a file containing destructive statements
// (DROP / DELETE / TRUNCATE / ALTER ... DROP COLUMN) unless --force is passed,
// so an accidental run can't wreck data. Wraps the file in a transaction.
import { readFileSync } from 'node:fs';
import pg from 'pg';

function loadEnv(name) {
  const txt = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[1] === name) return m[2].replace(/^['"]|['"]$/g, '');
  }
  return null;
}

const file = process.argv[2];
const force = process.argv.includes('--force');
if (!file) { console.error('Usage: node scripts/run-migration.mjs <path-to.sql> [--force]'); process.exit(1); }

const sql = readFileSync(file, 'utf8');
const danger = /\b(drop\s+table|drop\s+column|truncate|delete\s+from)\b/i;
if (danger.test(sql) && !force) {
  console.error(`✋ Refusing: "${file}" contains a destructive statement. Re-run with --force if you really mean it.`);
  process.exit(1);
}

const connectionString = loadEnv('SUPABASE_DB_URL');
if (!connectionString) { console.error('SUPABASE_DB_URL not found in .env.local'); process.exit(1); }

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query('begin');
  await client.query(sql);
  await client.query('commit');
  console.log(`✅ Applied: ${file}`);
} catch (err) {
  try { await client.query('rollback'); } catch {}
  console.error(`❌ Failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
