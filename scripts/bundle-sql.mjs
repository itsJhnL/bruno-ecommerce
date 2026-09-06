/**
 * Rebuilds `supabase/apply-all.sql` from the migrations and the seed.
 *
 *   npm run db:bundle
 *
 * The Supabase dashboard has no "run this folder" button, and pasting nine
 * files in the right order by hand is exactly the kind of step that gets done
 * in the wrong order once. One file, one paste, wrapped in a transaction.
 *
 * Run this after adding a migration, or the bundle silently goes stale.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE = join(process.cwd(), "supabase");
const MIGRATIONS = join(SUPABASE, "migrations");

const header = `-- =============================================================================
-- BRUNO COMMERCE — apply everything, in order, in one paste.
--
-- GENERATED FILE. Do not edit by hand: run \`npm run db:bundle\` to rebuild it
-- from supabase/migrations/*.sql and supabase/seed.sql.
--
-- HOW TO USE
--   1. Supabase dashboard -> SQL Editor -> New query
--   2. Paste this whole file
--   3. Run
--
-- It is safe on an empty database and safe to re-run the seed (every insert is
-- idempotent on its natural key). It is NOT safe to re-run the migrations over
-- a database that already has them: \`create table\` will error on the first
-- table it meets. That error is the correct behaviour — it means the schema is
-- already there.
--
-- After running, regenerate the types:
--   npx supabase gen types typescript --project-id <id> --schema public > types/database.ts
-- =============================================================================

begin;
`;

const banner = (title) =>
  `\n\n-- =============================================================================\n` +
  `-- ${title}\n` +
  `-- =============================================================================\n\n`;

const files = readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let out = header;
for (const file of files) {
  out += banner(file) + readFileSync(join(MIGRATIONS, file), "utf8");
}
out += banner("seed.sql — demo catalogue, content and settings");
out += readFileSync(join(SUPABASE, "seed.sql"), "utf8");
out += "\n\ncommit;\n";

const target = join(SUPABASE, "apply-all.sql");
writeFileSync(target, out, "utf8");

process.stdout.write(
  `Bundled ${files.length} migrations + seed into supabase/apply-all.sql ` +
    `(${Math.round(out.length / 1024)} KB)\n`
);
