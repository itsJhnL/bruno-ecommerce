/**
 * End-to-end assertions for the Phase 2 commerce path: cart, coupons, order
 * creation, stock reservation, payment settlement, idempotency and refusals.
 *
 *   npm run test:db
 *
 * Every check runs against the real migrations, so a change to the SQL that
 * breaks pricing or settlement fails here rather than in production.
 */
import { db, q } from './apply.mjs'

let failures = 0
const check = (label, cond, detail = '') => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`)
  if (!cond) failures++
}

console.log('\n=== Phase 2 checkout flow ===\n')

// A guest cart with two lines.
const cartId = (await q(`select ensure_cart(null, 'guest-token-abc') as id`))[0].id
check('ensure_cart creates a guest cart', !!cartId)

const same = (await q(`select ensure_cart(null, 'guest-token-abc') as id`))[0].id
check('ensure_cart is idempotent', same === cartId)

const variants = await q(`
  select v.id, v.sku, v.stock_quantity, p.price, p.name
    from product_variants v join products p on p.id = v.product_id
   where v.stock_quantity > 3 and p.status = 'ACTIVE'
   order by p.price desc limit 2`)
check('found two stocked variants', variants.length === 2)

for (const v of variants) {
  await q(`insert into cart_items (cart_id, variant_id, quantity) values ($1, $2, 2)`, [cartId, v.id])
}

let pricing = (await q(`select price_cart($1) as p`, [cartId]))[0].p
const expectedSubtotal = variants.reduce((s, v) => s + Number(v.price) * 2, 0)
check('subtotal is the sum of live prices', Number(pricing.subtotal) === expectedSubtotal,
  `${pricing.subtotal} vs ${expectedSubtotal}`)
check('item_count counts units, not lines', pricing.item_count === 4)
check('lines carry SKU and image', !!pricing.lines[0].sku)
check('nothing unavailable', pricing.has_unavailable === false)

// ---- Coupons --------------------------------------------------------------
const withCoupon = (code, ship = null, profile = null) =>
  q(`select price_cart($1, $2, $3, $4) as p`, [cartId, ship, code, profile]).then((r) => r[0].p)

let p = await withCoupon('WELCOME10')
check('WELCOME10 applies 10% capped at 300',
  Number(p.discount_total) === Math.min(Math.round(expectedSubtotal * 10) / 100 * 1, 300) ||
  Number(p.discount_total) === Math.min(Number((expectedSubtotal * 0.1).toFixed(2)), 300),
  `discount ${p.discount_total} on ${expectedSubtotal}`)
check('coupon marked valid', p.coupon_valid === true)

p = await withCoupon('NOPE')
check('unknown code is rejected', p.coupon_valid === false && Number(p.discount_total) === 0)
check('rejection carries a reason', typeof p.coupon_reason === 'string' && p.coupon_reason.length > 0,
  p.coupon_reason)

p = await withCoupon('ATELIER15')
check('members-only code rejected for a guest', p.coupon_valid === false, p.coupon_reason)

// ---- Shipping -------------------------------------------------------------
const methods = await q(`select id, name, price, free_over from shipping_methods order by position`)
const express = methods.find((m) => Number(m.price) > 0 && m.free_over !== null)
const whiteGlove = methods.find((m) => m.free_over === null && Number(m.price) > 0)

p = await withCoupon(null, whiteGlove.id)
check('paid shipping is added', Number(p.shipping_total) === Number(whiteGlove.price),
  `${p.shipping_total}`)
check('grand total = subtotal + shipping + tax',
  Number(p.grand_total) === Number(p.subtotal) + Number(p.shipping_total) + Number(p.tax_total))

p = await withCoupon(null, express.id)
const qualifies = expectedSubtotal >= Number(express.free_over)
check(`free_over threshold honoured (subtotal ${expectedSubtotal} vs ${express.free_over})`,
  qualifies ? Number(p.shipping_total) === 0 : Number(p.shipping_total) === Number(express.price))

// FREESHIP zeroes shipping regardless of threshold.
p = await withCoupon('FREESHIP', whiteGlove.id)
if (p.coupon_valid) {
  check('FREESHIP zeroes shipping', Number(p.shipping_total) === 0)
} else {
  check('FREESHIP rejected below its minimum', Number(p.shipping_total) === Number(whiteGlove.price),
    p.coupon_reason)
}

// ---- Scoped coupon --------------------------------------------------------
const firstProduct = (await q(`select p.id, p.name from products p
  join product_variants v on v.product_id = p.id where v.id = $1`, [variants[0].id]))[0]
await q(`insert into coupons (code, description, discount_type, scope, value, is_active)
         values ('SCOPED50', 'Fifty off one product', 'FIXED_AMOUNT', 'PRODUCT', 50, true)
         on conflict (code) do nothing`)
const scopedId = (await q(`select id from coupons where code = 'SCOPED50'`))[0].id
await q(`insert into coupon_products (coupon_id, product_id) values ($1, $2)
         on conflict do nothing`, [scopedId, firstProduct.id])

p = await withCoupon('SCOPED50')
check('product-scoped coupon applies', p.coupon_valid === true && Number(p.discount_total) === 50)

await q(`insert into coupons (code, description, discount_type, scope, value, is_active)
         values ('SCOPEDNONE', 'Applies to nothing here', 'PERCENTAGE', 'PRODUCT', 20, true)
         on conflict (code) do nothing`)
p = await withCoupon('SCOPEDNONE')
check('scoped coupon matching nothing is rejected', p.coupon_valid === false, p.coupon_reason)

// ---- Order creation -------------------------------------------------------
const stockBefore = Object.fromEntries(
  (await q(`select id, stock_quantity, reserved_quantity from product_variants where id = any($1)`,
    [variants.map((v) => v.id)])).map((r) => [r.id, r]))

const address = {
  first_name: 'Ada', last_name: 'Lovelace', line1: '12 Rue de Rivoli',
  city: 'Paris', postal_code: '75001', country_code: 'FR',
}

const created = (await q(
  `select create_order_from_cart($1, $2, $3, null, $4, $5, null, null, null) as o`,
  [cartId, 'ada@example.com', JSON.stringify(address), whiteGlove.id, 'WELCOME10']))[0].o

check('order created with a number', /^BR-\d{6}$/.test(created.order_number), created.order_number)

const order = (await q(`select * from orders where id = $1`, [created.order_id]))[0]
check('order starts PENDING', order.status === 'PENDING' && order.payment_status === 'PENDING')
check('totals were written by the database',
  Number(order.grand_total) === Number(created.grand_total))
check('discount recorded', Number(order.discount_total) > 0)
check('coupon snapshot on order', order.coupon_code === 'WELCOME10')
check('shipping method snapshot', order.shipping_method === whiteGlove.name)
check('billing defaults to shipping', order.billing_address.city === 'Paris')

const items = await q(`select * from order_items where order_id = $1`, [created.order_id])
check('two order lines snapshotted', items.length === 2)
check('line carries product name at purchase time', !!items[0].product_name)

const stockAfterOrder = Object.fromEntries(
  (await q(`select id, stock_quantity, reserved_quantity from product_variants where id = any($1)`,
    [variants.map((v) => v.id)])).map((r) => [r.id, r]))
check('stock not yet decremented',
  variants.every((v) => stockAfterOrder[v.id].stock_quantity === stockBefore[v.id].stock_quantity))
check('stock reserved instead',
  variants.every((v) => stockAfterOrder[v.id].reserved_quantity === stockBefore[v.id].reserved_quantity + 2))

const reservationRows = await q(
  `select count(*)::int n from inventory_transactions
    where reference_id = $1 and reason = 'RESERVATION'`, [created.order_id])
check('reservation written to the ledger', reservationRows[0].n === 2)

// ---- Payment settlement ---------------------------------------------------
// A second guest cart holding the same variant must survive settlement.
const bystanderCart = (await q(`select ensure_cart(null, 'bystander-token') as id`))[0].id
await q(`insert into cart_items (cart_id, variant_id, quantity) values ($1, $2, 1)`,
  [bystanderCart, variants[0].id])

// startCheckout writes this row before redirecting to Stripe.
await q(`insert into payments (order_id, provider, stripe_checkout_session_id, status, amount, currency)
         values ($1, 'stripe', 'cs_test_123', 'PENDING', $2, 'USD')`,
  [created.order_id, created.grand_total])

const paid = (await q(
  `select mark_order_paid($1, 'pi_test_123', 'cs_test_123', $2, 'visa', '4242', 'ch_1') as r`,
  [created.order_id, created.grand_total]))[0].r
check('mark_order_paid reports not-already-paid', paid.already_paid === false)

const paidOrder = (await q(`select * from orders where id = $1`, [created.order_id]))[0]
check('order is PAID', paidOrder.status === 'PAID' && paidOrder.payment_status === 'PAID')
check('paid_at set', !!paidOrder.paid_at)

const stockAfterPaid = Object.fromEntries(
  (await q(`select id, stock_quantity, reserved_quantity from product_variants where id = any($1)`,
    [variants.map((v) => v.id)])).map((r) => [r.id, r]))
check('stock decremented on payment',
  variants.every((v) => stockAfterPaid[v.id].stock_quantity === stockBefore[v.id].stock_quantity - 2))
check('reservation released',
  variants.every((v) => stockAfterPaid[v.id].reserved_quantity === stockBefore[v.id].reserved_quantity))

const payment = (await q(`select * from payments where order_id = $1`, [created.order_id]))[0]
check('payment row stores only Stripe references',
  payment.stripe_payment_intent_id === 'pi_test_123' && payment.card_last4 === '4242')
check('no column could hold a card number',
  !Object.keys(payment).some((k) => /pan|card_number|cvv|cvc/i.test(k)))

const redemption = await q(`select * from coupon_redemptions where order_id = $1`, [created.order_id])
check('coupon redemption recorded', redemption.length === 1)
const couponAfter = (await q(`select used_count from coupons where code = 'WELCOME10'`))[0]
check('coupon used_count incremented', couponAfter.used_count === 1)

const notif = await q(`select * from notifications where audience = 'STAFF' and type = 'order.placed'`)
check('staff notified of the new order', notif.length === 1)

const cartGone = await q(`select count(*)::int n from carts where id = $1`, [cartId])
check('cart consumed', cartGone[0].n === 0)

const bystanderAlive = await q(`select count(*)::int n from carts where id = $1`, [bystanderCart])
check("another shopper's cart untouched", bystanderAlive[0].n === 1)

const paymentRows = await q(`select count(*)::int n from payments where order_id = $1`,
  [created.order_id])
check('settlement updated the pending payment rather than inserting a second',
  paymentRows[0].n === 1, `${paymentRows[0].n} rows`)

// ---- Idempotency ----------------------------------------------------------
const replay = (await q(
  `select mark_order_paid($1, 'pi_test_123', 'cs_test_123', $2, 'visa', '4242', 'ch_1') as r`,
  [created.order_id, created.grand_total]))[0].r
check('replayed webhook is a no-op', replay.already_paid === true)

const stockAfterReplay = (await q(
  `select stock_quantity from product_variants where id = $1`, [variants[0].id]))[0]
check('replay did not double-decrement',
  stockAfterReplay.stock_quantity === stockBefore[variants[0].id].stock_quantity - 2)

const units = (await q(`select units_sold from products where id = $1`, [firstProduct.id]))[0]
check('units_sold advanced', units.units_sold >= 2)

// ---- Empty cart and oversell ---------------------------------------------
const emptyCart = (await q(`select ensure_cart(null, 'empty-token') as id`))[0].id
let threw = null
try {
  await q(`select create_order_from_cart($1, $2, $3, null, null, null, null, null, null)`,
    [emptyCart, 'x@example.com', JSON.stringify(address)])
} catch (e) { threw = e.message }
check('empty cart is refused', threw !== null && /empty/i.test(threw), threw ?? '')

const lowVariant = (await q(`select id, stock_quantity from product_variants
  where stock_quantity > 0 order by stock_quantity limit 1`))[0]
const overCart = (await q(`select ensure_cart(null, 'over-token') as id`))[0].id
await q(`insert into cart_items (cart_id, variant_id, quantity) values ($1, $2, $3)`,
  [overCart, lowVariant.id, lowVariant.stock_quantity + 5])
threw = null
try {
  await q(`select create_order_from_cart($1, $2, $3, null, null, null, null, null, null)`,
    [overCart, 'x@example.com', JSON.stringify(address)])
} catch (e) { threw = e.message }
check('overselling is refused', threw !== null && /no longer available/i.test(threw), threw ?? '')

const overPricing = (await q(`select price_cart($1) as p`, [overCart]))[0].p
check('price_cart flags the unavailable line', overPricing.has_unavailable === true)

// ---- Failed payment -------------------------------------------------------
const failCart = (await q(`select ensure_cart(null, 'fail-token') as id`))[0].id
await q(`insert into cart_items (cart_id, variant_id, quantity) values ($1, $2, 1)`,
  [failCart, variants[0].id])
const failOrder = (await q(
  `select create_order_from_cart($1, $2, $3, null, null, null, null, null, null) as o`,
  [failCart, 'fail@example.com', JSON.stringify(address)]))[0].o
const reservedDuring = (await q(`select reserved_quantity from product_variants where id = $1`,
  [variants[0].id]))[0].reserved_quantity
await q(`select mark_order_payment_failed($1, 'Card declined')`, [failOrder.order_id])
const reservedAfter = (await q(`select reserved_quantity from product_variants where id = $1`,
  [variants[0].id]))[0].reserved_quantity
check('failed payment releases the reservation', reservedAfter === reservedDuring - 1)
const failed = (await q(`select status, payment_status from orders where id = $1`,
  [failOrder.order_id]))[0]
check('failed order is CANCELLED', failed.status === 'CANCELLED' && failed.payment_status === 'FAILED')

// ---- Guest cart merge -----------------------------------------------------
const userId = (await q(`insert into auth.users (email) values ('ada@example.com') returning id`))[0].id
const mergeGuest = (await q(`select ensure_cart(null, 'merge-token') as id`))[0].id
await q(`insert into cart_items (cart_id, variant_id, quantity) values ($1, $2, 2)`,
  [mergeGuest, variants[0].id])
const userCart = (await q(`select ensure_cart($1, null) as id`, [userId]))[0].id
await q(`insert into cart_items (cart_id, variant_id, quantity) values ($1, $2, 1)`,
  [userCart, variants[0].id])
const merged = (await q(`select merge_guest_cart('merge-token', $1) as id`, [userId]))[0].id
check('merge returns the customer cart', merged === userCart)
const mergedQty = (await q(`select quantity from cart_items where cart_id = $1 and variant_id = $2`,
  [userCart, variants[0].id]))[0].quantity
check('quantities add on merge', mergedQty === 3)
const guestGone = (await q(`select count(*)::int n from carts where session_token = 'merge-token'`))[0]
check('guest cart removed after merge', guestGone.n === 0)

// ---- RLS smoke ------------------------------------------------------------
await db.exec(`grant usage on schema public to anon;
               grant select on all tables in schema public to anon;`)
await db.exec(`set role anon`)
const anonOrders = await q(`select count(*)::int n from orders`)
check('anon reads zero orders', anonOrders[0].n === 0)
const anonCarts = await q(`select count(*)::int n from carts`)
check('anon reads zero carts', anonCarts[0].n === 0)
const anonEmail = await q(`select count(*)::int n from email_log`)
check('anon reads zero email_log rows', anonEmail[0].n === 0)
const anonProducts = await q(`select count(*)::int n from products`)
check('anon still reads the catalogue', anonProducts[0].n > 0)
await db.exec(`reset role`)

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}\n`)
process.exit(failures === 0 ? 0 : 1)
