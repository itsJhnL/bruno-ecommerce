/**
 * Proves that one customer cannot read another customer's rows.
 *
 * Goals.md Phase 3 asks for this to be "proven by a failing-by-default test".
 * That phrase matters: the assertions below are written so that if RLS were
 * removed entirely, they would FAIL rather than silently pass. Every check
 * therefore looks for a specific absence — Ada must see exactly her own row and
 * exactly zero of Blaise's — not merely for "no error".
 *
 *   node supabase/tests/rls-isolation.mjs
 *
 * It runs as the `authenticated` role with a JWT claim, which is how Supabase
 * actually executes a customer's query. Running as `postgres` would bypass RLS
 * and pass no matter what the policies said.
 */
import { db, q } from './apply.mjs'

let failures = 0
const check = (label, cond, detail = '') => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`)
  if (!cond) failures++
}

console.log('\n=== RLS: customer isolation ===\n')

// ---- Two customers, each with something worth stealing ---------------------
const [ada] = await q(
  `insert into auth.users (email, raw_user_meta_data)
   values ('ada@example.com', '{"full_name":"Ada Lovelace"}'::jsonb) returning id`
)
const [blaise] = await q(
  `insert into auth.users (email, raw_user_meta_data)
   values ('blaise@example.com', '{"full_name":"Blaise Pascal"}'::jsonb) returning id`
)

const profiles = await q(`select count(*)::int n from profiles where id = any($1)`,
  [[ada.id, blaise.id]])
check('a profile row is created for each new auth user', profiles[0].n === 2)

const variant = (await q(
  `select v.id from product_variants v join products p on p.id = v.product_id
    where v.stock_quantity > 2 and p.status = 'ACTIVE' limit 1`
))[0]

const address = JSON.stringify({
  first_name: 'X', last_name: 'Y', line1: '1 Road', city: 'Paris',
  postal_code: '75001', country_code: 'FR',
})

const orders = {}
for (const [name, user] of [['ada', ada], ['blaise', blaise]]) {
  const cart = (await q(`select ensure_cart($1, null) as id`, [user.id]))[0].id
  await q(`insert into cart_items (cart_id, variant_id, quantity) values ($1, $2, 1)`,
    [cart, variant.id])
  const created = (await q(
    `select create_order_from_cart($1, $2, $3, null, null, null, null, null, $4) as o`,
    [cart, `${name}@example.com`, address, user.id]
  ))[0].o
  orders[name] = created.order_id

  await q(
    `insert into addresses (profile_id, first_name, last_name, line1, city, postal_code, country_code)
     values ($1, $2, 'Test', '1 Road', 'Paris', '75001', 'FR')`, [user.id, name]
  )
  const list = (await q(
    `insert into wishlists (profile_id, name) values ($1, 'Saved') returning id`, [user.id]
  ))[0]
  await q(`insert into wishlist_items (wishlist_id, product_id)
           select $1, product_id from product_variants where id = $2`, [list.id, variant.id])
}

// Blaise also writes a review that has not been approved.
await q(
  `insert into reviews (product_id, profile_id, author_name, rating, body, status)
   select product_id, $1, 'Blaise', 5, 'A private draft nobody else should read.', 'PENDING'
     from product_variants where id = $2`,
  [blaise.id, variant.id]
)

// ---- Become Ada, exactly as PostgREST would --------------------------------
await db.exec(`
  grant usage on schema public to authenticated;
  grant select, insert, update, delete on all tables in schema public to authenticated;
`)

async function asCustomer(userId, fn) {
  await db.exec(`set role authenticated`)
  await q(`select set_config('request.jwt.claim.sub', $1, false)`, [userId])
  try {
    return await fn()
  } finally {
    await db.exec(`reset role`)
    await q(`select set_config('request.jwt.claim.sub', '', false)`)
  }
}

await asCustomer(ada.id, async () => {
  const own = await q(`select id from orders`)
  check('Ada sees exactly one order', own.length === 1, `${own.length} rows`)
  check('and it is hers', own[0]?.id === orders.ada)

  const stolen = await q(`select id from orders where id = $1`, [orders.blaise])
  check("Ada cannot read Blaise's order by id", stolen.length === 0, `${stolen.length} rows`)

  const items = await q(`select id from order_items where order_id = $1`, [orders.blaise])
  check("Ada cannot read Blaise's order lines", items.length === 0, `${items.length} rows`)

  const payments = await q(`select id from payments`)
  check('Ada sees no payments she does not own', payments.length === 0)

  const addresses = await q(`select first_name from addresses`)
  check('Ada sees exactly one address', addresses.length === 1, `${addresses.length} rows`)
  check('and it is hers', addresses[0]?.first_name === 'ada')

  const lists = await q(`select id from wishlists`)
  check('Ada sees exactly one wishlist', lists.length === 1, `${lists.length} rows`)

  const items2 = await q(`select id from wishlist_items`)
  check('Ada sees exactly one saved item', items2.length === 1, `${items2.length} rows`)

  const carts = await q(`select id from carts`)
  check('Ada sees exactly one cart', carts.length === 1, `${carts.length} rows`)

  const pending = await q(`select id from reviews where status = 'PENDING'`)
  check("Ada cannot read Blaise's unapproved review", pending.length === 0, `${pending.length} rows`)

  const profiles = await q(`select id from profiles`)
  check('Ada sees exactly one profile', profiles.length === 1, `${profiles.length} rows`)

  const coupons = await q(`select id from coupons`)
  check('Ada cannot read the coupon table', coupons.length === 0, `${coupons.length} rows`)

  const emails = await q(`select id from email_log`)
  check('Ada cannot read the email log', emails.length === 0)

  // Writes, not just reads. An UPDATE that matches no row raises no error, so
  // the proof is the value afterwards — checked below, outside this role.
  try {
    await q(`update orders set internal_note = 'hacked' where id = $1`, [orders.blaise])
  } catch { /* refused outright is also a pass */ }

  let insertThrew = null
  try {
    await q(`insert into addresses (profile_id, first_name, last_name, line1, city, postal_code, country_code)
             values ($1, 'Trojan', 'Horse', '1 Road', 'Paris', '75001', 'FR')`, [blaise.id])
  } catch (e) { insertThrew = e.message }
  check('Ada cannot create an address owned by Blaise', insertThrew !== null,
    insertThrew ? 'refused' : 'ACCEPTED — policy is wrong')

  // The privilege-escalation guard.
  await q(`update profiles set role = 'SUPER_ADMIN' where id = $1`, [ada.id])
})

// Back as the owner, to see what actually changed.
const tampered = (await q(`select internal_note from orders where id = $1`, [orders.blaise]))[0]
check("Ada's write to Blaise's order changed nothing", tampered.internal_note === null,
  tampered.internal_note ?? 'still null')

const adaRole = (await q(`select role from profiles where id = $1`, [ada.id]))[0]
check('Ada could not promote herself to SUPER_ADMIN', adaRole.role === 'CUSTOMER', adaRole.role)

// ---- And the mirror image, so the test is not accidentally one-sided -------
await asCustomer(blaise.id, async () => {
  const own = await q(`select id from orders`)
  check('Blaise sees exactly one order', own.length === 1, `${own.length} rows`)
  check('and it is his', own[0]?.id === orders.blaise)

  const draft = await q(`select id from reviews where status = 'PENDING'`)
  check('Blaise can read his own unapproved review', draft.length === 1, `${draft.length} rows`)
})

// ---- Anonymous ------------------------------------------------------------
await db.exec(`grant usage on schema public to anon;
               grant select on all tables in schema public to anon;`)
await db.exec(`set role anon`)
const anonOrders = await q(`select id from orders`)
check('an anonymous visitor sees no orders', anonOrders.length === 0)
const anonProfiles = await q(`select id from profiles`)
check('an anonymous visitor sees no profiles', anonProfiles.length === 0)
const anonAddresses = await q(`select id from addresses`)
check('an anonymous visitor sees no addresses', anonAddresses.length === 0)
const anonProducts = await q(`select id from products`)
check('an anonymous visitor still sees the catalogue', anonProducts.length > 0)
await db.exec(`reset role`)

console.log(`\n${failures === 0 ? 'ISOLATION OK' : failures + ' FAILURE(S)'}\n`)
process.exit(failures === 0 ? 0 : 1)
