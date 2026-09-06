/**
 * Proves `supabase/apply-all.sql` applies cleanly, as one transaction, to an
 * empty PostgreSQL 16. The bundle is what a human actually pastes into the
 * Supabase SQL editor, so it is the artefact worth testing — not just the
 * migrations it was built from.
 *
 *   node supabase/tests/bundle.mjs
 */
import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import { unaccent } from '@electric-sql/pglite/contrib/unaccent'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SUPABASE = path.resolve(HERE, '..')

const db = await PGlite.create({ extensions: { citext, pg_trgm, unaccent } })

await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema if not exists auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(), email text,
    raw_user_meta_data jsonb default '{}'::jsonb, created_at timestamptz default now());
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid; $$;
  create or replace function auth.role() returns text language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon'); $$;
`)

// PGlite ships no pgcrypto; gen_random_uuid() is core in PG13+.
const sql = readFileSync(path.join(SUPABASE, 'apply-all.sql'), 'utf8')
  .replace(/create extension if not exists "pgcrypto";/g, '')

try {
  await db.exec(sql)
  console.log('  ok   apply-all.sql applied in one transaction')
} catch (e) {
  console.error('  FAIL apply-all.sql\n       ' + e.message)
  process.exit(1)
}

const q = async (s) => (await db.query(s)).rows
const checks = [
  ['products',         'select count(*)::int n from products',                14],
  ['variants',         'select count(*)::int n from product_variants',        97],
  ['shipping methods', 'select count(*)::int n from shipping_methods',         3],
  ['coupons',          'select count(*)::int n from coupons',                  4],
  ['tables w/o RLS',   `select count(*)::int n from pg_tables t where t.schemaname='public'
     and not exists (select 1 from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
     where ns.nspname='public' and c.relname=t.tablename and c.relrowsecurity)`, 0],
]

let bad = 0
for (const [label, sqlText, expected] of checks) {
  const n = (await q(sqlText))[0].n
  const ok = n === expected
  if (!ok) bad++
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}: ${n}${ok ? '' : ` (expected ${expected})`}`)
}

// The functions the storefront and checkout actually call must be reachable.
for (const fn of ['price_cart', 'ensure_cart', 'create_order_from_cart', 'mark_order_paid',
                  'validate_coupon', 'related_products', 'auth_role', 'is_staff']) {
  const n = (await q(`select count(*)::int n from pg_proc p join pg_namespace ns
                        on ns.oid = p.pronamespace
                       where ns.nspname = 'public' and p.proname = '${fn}'`))[0].n
  if (n === 0) { bad++; console.log(`  FAIL function ${fn} missing`) }
  else console.log(`  ok   function ${fn}`)
}

console.log(bad === 0 ? '\nBUNDLE OK\n' : `\n${bad} PROBLEM(S)\n`)
process.exit(bad === 0 ? 0 : 1)
