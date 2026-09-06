/**
 * Applies every migration, in order, then the seed — against a real PostgreSQL 16
 * engine running in WASM. No server, no Docker, no Supabase project needed.
 *
 *   npm run test:db
 *
 * Exported so checkout-flow.mjs can run its assertions on the same instance.
 */
import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import { unaccent } from '@electric-sql/pglite/contrib/unaccent'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SUPABASE = path.resolve(HERE, '..')
const MIG = path.join(SUPABASE, 'migrations')

const db = await PGlite.create({ extensions: { citext, pg_trgm, unaccent } })

// ---- Supabase-shaped stubs: roles, the auth schema, auth.uid() -------------
await db.exec(`
  create role anon;
  create role authenticated;
  create role service_role;
  create schema if not exists auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb,
    created_at timestamptz default now()
  );
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $$;
  create or replace function auth.role() returns text language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon');
  $$;
`)

const files = readdirSync(MIG).filter((f) => f.endsWith('.sql')).sort()
for (const f of files) {
  // Harness-only shim: PGlite has no pgcrypto bundle, but gen_random_uuid()
  // is core in PG13+. Nothing else in the migrations uses pgcrypto.
  const sql = readFileSync(path.join(MIG, f), 'utf8')
    .replace(/create extension if not exists "pgcrypto";/g, '')
  try {
    await db.exec(sql)
    console.log(`  ok   ${f}`)
  } catch (e) {
    console.error(`  FAIL ${f}\n       ${e.message}`)
    process.exit(1)
  }
}

try {
  await db.exec(readFileSync(path.join(SUPABASE, 'seed.sql'), 'utf8'))
  console.log('  ok   seed.sql')
} catch (e) {
  console.error(`  FAIL seed.sql\n       ${e.message}`)
  process.exit(1)
}

const q = async (sql, params) => (await db.query(sql, params)).rows

console.log('\n--- shape ---')
for (const [label, sql] of [
  ['products', 'select count(*)::int n from products'],
  ['variants', 'select count(*)::int n from product_variants'],
  ['shipping_methods', 'select count(*)::int n from shipping_methods'],
  ['coupons', 'select count(*)::int n from coupons'],
  ['tables without RLS', `select count(*)::int n from pg_tables t
     where t.schemaname='public' and not exists (
       select 1 from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
       where ns.nspname='public' and c.relname=t.tablename and c.relrowsecurity)`],
]) {
  console.log(`  ${label}: ${(await q(sql))[0].n}`)
}

export { db, q }
