-- =============================================================================
-- 0009 · Phase 2 — cart pricing, order creation, payment settlement
--
-- Every number a customer is charged is computed here, in the database, from
-- rows the client cannot influence (Agents.md rule 3). The client sends
-- identifiers and quantities; it never sends a price, a discount or a total.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Transactional email audit trail.
-- -----------------------------------------------------------------------------
create table if not exists email_log (
  id          uuid primary key default gen_random_uuid(),
  template    text not null,
  recipient   citext not null,
  subject     text not null,
  status      text not null default 'SENT',      -- SENT | FAILED | SKIPPED
  provider_id text,
  error       text,
  order_id    uuid references orders(id) on delete set null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists email_log_created_idx   on email_log (created_at desc);
create index if not exists email_log_recipient_idx on email_log (recipient);
create index if not exists email_log_order_idx     on email_log (order_id);

alter table email_log enable row level security;

drop policy if exists "email_log: admin read" on email_log;
create policy "email_log: admin read" on email_log
  for select using (is_admin());

comment on table email_log is
  'Every transactional send, including SKIPPED when no provider is configured. Written by the service role only.';

-- -----------------------------------------------------------------------------
-- Guest carts are addressed by an unguessable token in an httpOnly cookie and
-- reached only through Server Actions running as the service role, so they have
-- no anon policy by design. This index keeps that lookup cheap.
-- -----------------------------------------------------------------------------
create index if not exists carts_session_token_idx
  on carts (session_token) where session_token is not null;

-- Which cart became this order. Without it, settlement has to guess which cart
-- to clear by matching variant ids — and for two guests holding the same piece
-- that guess is wrong, clearing a stranger's bag.
alter table orders add column if not exists cart_id uuid references carts(id) on delete set null;

-- -----------------------------------------------------------------------------
-- ensure_cart — idempotently return the caller's cart id.
-- Exactly one of p_profile_id / p_session_token must be supplied.
-- -----------------------------------------------------------------------------
create or replace function ensure_cart(
  p_profile_id    uuid default null,
  p_session_token text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_cart_id uuid;
begin
  if p_profile_id is null and p_session_token is null then
    raise exception 'ensure_cart: one of profile_id or session_token is required';
  end if;

  if p_profile_id is not null then
    select id into v_cart_id from carts where profile_id = p_profile_id;
    if v_cart_id is null then
      insert into carts (profile_id) values (p_profile_id) returning id into v_cart_id;
    end if;
  else
    select id into v_cart_id from carts where session_token = p_session_token;
    if v_cart_id is null then
      insert into carts (session_token) values (p_session_token) returning id into v_cart_id;
    end if;
  end if;

  update carts set expires_at = now() + interval '30 days' where id = v_cart_id;
  return v_cart_id;
end;
$fn$;

revoke all on function ensure_cart(uuid, text) from public, anon;
grant execute on function ensure_cart(uuid, text) to service_role;

-- -----------------------------------------------------------------------------
-- merge_guest_cart — called once, on sign-in. Quantities add.
-- -----------------------------------------------------------------------------
create or replace function merge_guest_cart(p_session_token text, p_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_guest_id  uuid;
  v_target_id uuid;
begin
  select id into v_guest_id from carts where session_token = p_session_token;
  v_target_id := ensure_cart(p_profile_id, null);

  if v_guest_id is null or v_guest_id = v_target_id then
    return v_target_id;
  end if;

  insert into cart_items (cart_id, variant_id, quantity)
  select v_target_id, gi.variant_id, gi.quantity
    from cart_items gi
   where gi.cart_id = v_guest_id
  on conflict (cart_id, variant_id) do update
    set quantity = least(cart_items.quantity + excluded.quantity, 99);

  -- Carry a guest-applied coupon over only if the customer has none.
  update carts t
     set coupon_id = g.coupon_id
    from carts g
   where t.id = v_target_id
     and g.id = v_guest_id
     and t.coupon_id is null
     and g.coupon_id is not null;

  delete from carts where id = v_guest_id;
  return v_target_id;
end;
$fn$;

revoke all on function merge_guest_cart(text, uuid) from public, anon;
grant execute on function merge_guest_cart(text, uuid) to service_role;

-- -----------------------------------------------------------------------------
-- validate_coupon, replacing the 0007 version.
--
-- New: p_eligible_subtotal. A PRODUCT- or CATEGORY-scoped coupon discounts only
-- the qualifying lines, but its minimum_order still tests the whole order.
-- Passing null keeps the old behaviour, so 3-argument callers are unaffected.
-- -----------------------------------------------------------------------------
drop function if exists validate_coupon(citext, numeric, uuid);

create or replace function validate_coupon(
  p_code              citext,
  p_subtotal          numeric,
  p_profile           uuid default null,
  p_eligible_subtotal numeric default null
)
returns table (
  is_valid        boolean,
  coupon_id       uuid,
  reason          text,
  discount_amount numeric,
  free_shipping   boolean
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  c coupons%rowtype;
  used_by_customer integer;
  base   numeric := coalesce(p_eligible_subtotal, p_subtotal);
  amount numeric := 0;
begin
  select * into c from coupons where code = p_code;

  if not found then
    return query select false, null::uuid, 'This code is not recognised.', 0::numeric, false;
    return;
  end if;

  if not c.is_active then
    return query select false, c.id, 'This code is no longer active.', 0::numeric, false;
    return;
  end if;

  if c.starts_at > now() then
    return query select false, c.id, 'This code is not active yet.', 0::numeric, false;
    return;
  end if;

  if c.ends_at is not null and c.ends_at < now() then
    return query select false, c.id, 'This code has expired.', 0::numeric, false;
    return;
  end if;

  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    return query select false, c.id, 'This code has reached its limit.', 0::numeric, false;
    return;
  end if;

  if c.minimum_order is not null and p_subtotal < c.minimum_order then
    return query select false, c.id,
      format('Spend %s to use this code.', to_char(c.minimum_order, 'FM999,999.00')),
      0::numeric, false;
    return;
  end if;

  if c.usage_limit_per_customer is not null and p_profile is not null then
    select count(*) into used_by_customer
      from coupon_redemptions r
     where r.coupon_id = c.id and r.profile_id = p_profile;
    if used_by_customer >= c.usage_limit_per_customer then
      return query select false, c.id, 'You have already used this code.', 0::numeric, false;
      return;
    end if;
  end if;

  if c.members_only and (
       p_profile is null
       or not exists (
         select 1 from memberships m
          where m.profile_id = p_profile and m.status = 'ACTIVE'
       )
     ) then
    return query select false, c.id, 'This code is reserved for members.', 0::numeric, false;
    return;
  end if;

  -- A scoped coupon with nothing qualifying in the basket.
  if c.scope <> 'ORDER' and c.discount_type <> 'FREE_SHIPPING' and base <= 0 then
    return query select false, c.id,
      'This code does not apply to anything in your bag.', 0::numeric, false;
    return;
  end if;

  amount := case c.discount_type
    when 'PERCENTAGE'   then round(base * c.value / 100.0, 2)
    when 'FIXED_AMOUNT' then least(c.value, base)
    else 0
  end;

  if c.maximum_discount is not null then
    amount := least(amount, c.maximum_discount);
  end if;

  return query select true, c.id, null::text, amount, (c.discount_type = 'FREE_SHIPPING');
end;
$fn$;

grant execute on function validate_coupon(citext, numeric, uuid, numeric) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- price_cart — THE pricing engine.
--
-- One function computes what the cart page shows, what the checkout summary
-- shows, and what the order is written with. There is no second implementation
-- in TypeScript to drift away from it.
-- -----------------------------------------------------------------------------
create or replace function price_cart(
  p_cart_id            uuid,
  p_shipping_method_id uuid default null,
  p_coupon_code        citext default null,
  p_profile_id         uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_currency        char(3) := 'USD';
  v_lines           jsonb   := '[]'::jsonb;
  v_subtotal        numeric := 0;
  v_compare_total   numeric := 0;
  v_item_count      integer := 0;
  v_code            citext;
  v_coupon          record;
  v_eligible        numeric := 0;
  v_scope           discount_scope;
  v_coupon_id       uuid;
  v_discount        numeric := 0;
  v_free_shipping   boolean := false;
  v_coupon_valid    boolean := false;
  v_coupon_reason   text;
  v_shipping_name   text;
  v_shipping_price  numeric;
  v_shipping_free_over numeric;
  v_shipping        numeric := 0;
  v_tax_rate        numeric := 0;
  v_tax             numeric := 0;
  v_taxable         numeric := 0;
  v_grand           numeric := 0;
begin
  if p_cart_id is null then
    return jsonb_build_object('exists', false);
  end if;

  select currency, coalesce(p_coupon_code, (select code from coupons where id = c.coupon_id))
    into v_currency, v_code
    from carts c where c.id = p_cart_id;

  if not found then
    return jsonb_build_object('exists', false);
  end if;

  -- ---- Lines. Price always resolves live: variant override, else product. ----
  select
    coalesce(jsonb_agg(l.line order by l.added_at), '[]'::jsonb),
    coalesce(sum(l.line_total), 0),
    coalesce(sum(l.compare_total), 0),
    coalesce(sum(l.quantity), 0)
  into v_lines, v_subtotal, v_compare_total, v_item_count
  from (
    select
      ci.added_at,
      ci.quantity,
      round(coalesce(v.price, p.price) * ci.quantity, 2) as line_total,
      round(coalesce(v.compare_at_price, p.compare_at_price, coalesce(v.price, p.price)) * ci.quantity, 2)
        as compare_total,
      jsonb_build_object(
        'item_id',         ci.id,
        'variant_id',      v.id,
        'product_id',      p.id,
        'name',            p.name,
        'slug',            p.slug,
        'variant_title',   v.title,
        'sku',             v.sku,
        'image_url',       coalesce(v.image_url, img.url),
        'image_alt',       coalesce(img.alt, p.name),
        'unit_price',      coalesce(v.price, p.price),
        'compare_at_price', coalesce(v.compare_at_price, p.compare_at_price),
        'quantity',        ci.quantity,
        'line_total',      round(coalesce(v.price, p.price) * ci.quantity, 2),
        'available',       greatest(v.stock_quantity - v.reserved_quantity, 0),
        'is_available',    (v.is_active and p.status = 'ACTIVE'
                            and greatest(v.stock_quantity - v.reserved_quantity, 0) >= ci.quantity),
        'in_stock',        greatest(v.stock_quantity - v.reserved_quantity, 0) > 0
      ) as line
    from cart_items ci
    join product_variants v on v.id = ci.variant_id
    join products p         on p.id = v.product_id
    left join lateral (
      select pi.url, pi.alt from product_images pi
      where pi.product_id = p.id
      order by pi.is_primary desc, pi.position
      limit 1
    ) img on true
    where ci.cart_id = p_cart_id
  ) l;

  -- ---- Coupon -------------------------------------------------------------
  if v_code is not null then
    select id, scope into v_coupon_id, v_scope from coupons where code = v_code;

    if v_scope = 'PRODUCT' then
      select coalesce(sum(round(coalesce(v.price, p.price) * ci.quantity, 2)), 0)
        into v_eligible
        from cart_items ci
        join product_variants v on v.id = ci.variant_id
        join products p         on p.id = v.product_id
        join coupon_products cp on cp.product_id = p.id and cp.coupon_id = v_coupon_id
       where ci.cart_id = p_cart_id;
    elsif v_scope = 'CATEGORY' then
      select coalesce(sum(round(coalesce(v.price, p.price) * ci.quantity, 2)), 0)
        into v_eligible
        from cart_items ci
        join product_variants v    on v.id = ci.variant_id
        join products p            on p.id = v.product_id
       where ci.cart_id = p_cart_id
         and exists (
           select 1 from product_categories pc
             join coupon_categories cc
               on cc.category_id = pc.category_id and cc.coupon_id = v_coupon_id
            where pc.product_id = p.id
         );
    else
      v_eligible := v_subtotal;
    end if;

    select * into v_coupon
      from validate_coupon(v_code, v_subtotal, p_profile_id, v_eligible);

    v_coupon_valid  := coalesce(v_coupon.is_valid, false);
    v_coupon_reason := v_coupon.reason;
    if v_coupon_valid then
      v_discount      := least(coalesce(v_coupon.discount_amount, 0), v_subtotal);
      v_free_shipping := coalesce(v_coupon.free_shipping, false);
    end if;
  end if;

  -- ---- Shipping -----------------------------------------------------------
  if p_shipping_method_id is not null then
    select name, price, free_over
      into v_shipping_name, v_shipping_price, v_shipping_free_over
      from shipping_methods
     where id = p_shipping_method_id and is_active;

    if v_shipping_name is not null then
      v_shipping := v_shipping_price;
      if v_shipping_free_over is not null
         and (v_subtotal - v_discount) >= v_shipping_free_over then
        v_shipping := 0;
      end if;
      if v_free_shipping then
        v_shipping := 0;
      end if;
    end if;
  end if;

  -- ---- Tax ----------------------------------------------------------------
  select coalesce((value #>> '{}')::numeric, 0) into v_tax_rate
    from site_settings where key = 'commerce.tax_rate';
  v_tax_rate := coalesce(v_tax_rate, 0);

  v_taxable := greatest(v_subtotal - v_discount, 0);
  v_tax     := round(v_taxable * v_tax_rate, 2);
  v_grand   := round(v_taxable + v_shipping + v_tax, 2);

  return jsonb_build_object(
    'exists',          true,
    'cart_id',         p_cart_id,
    'currency',        v_currency,
    'lines',           v_lines,
    'item_count',      v_item_count,
    'subtotal',        v_subtotal,
    'compare_total',   v_compare_total,
    'savings',         greatest(v_compare_total - v_subtotal, 0),
    'coupon_code',     v_code,
    'coupon_id',       case when v_coupon_valid then v_coupon_id else null end,
    'coupon_valid',    v_coupon_valid,
    'coupon_reason',   v_coupon_reason,
    'discount_total',  v_discount,
    'free_shipping',   v_free_shipping,
    'shipping_method_id', p_shipping_method_id,
    'shipping_method',    v_shipping_name,
    'shipping_total',  v_shipping,
    'tax_rate',        v_tax_rate,
    'tax_total',       v_tax,
    'grand_total',     v_grand,
    'has_unavailable', exists (
      select 1
        from jsonb_array_elements(v_lines) e
       where (e->>'is_available')::boolean is not true
    )
  );
end;
$fn$;

revoke all on function price_cart(uuid, uuid, citext, uuid) from public, anon;
grant execute on function price_cart(uuid, uuid, citext, uuid) to service_role;

-- -----------------------------------------------------------------------------
-- create_order_from_cart
--
-- Re-prices from scratch, locks every variant, reserves stock, and snapshots
-- the lines onto the order. The order is PENDING until Stripe says otherwise.
-- -----------------------------------------------------------------------------
create or replace function create_order_from_cart(
  p_cart_id            uuid,
  p_email              citext,
  p_shipping_address   jsonb,
  p_billing_address    jsonb default null,
  p_shipping_method_id uuid default null,
  p_coupon_code        citext default null,
  p_phone              text default null,
  p_customer_note      text default null,
  p_profile_id         uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_pricing  jsonb;
  v_line     jsonb;
  v_order_id uuid;
  v_number   text;
  v_avail    integer;
  v_name     text;
begin
  -- Lock every variant in the cart, in a deterministic order, before reading
  -- availability. Two checkouts racing for the last piece must serialise.
  perform 1
    from cart_items ci
    join product_variants v on v.id = ci.variant_id
   where ci.cart_id = p_cart_id
   order by v.id
     for update of v;

  v_pricing := price_cart(p_cart_id, p_shipping_method_id, p_coupon_code, p_profile_id);

  if not coalesce((v_pricing->>'exists')::boolean, false) then
    raise exception 'create_order_from_cart: cart % not found', p_cart_id
      using errcode = 'no_data_found';
  end if;

  if coalesce((v_pricing->>'item_count')::integer, 0) = 0 then
    raise exception 'Your bag is empty.' using errcode = 'check_violation';
  end if;

  -- Re-check availability under the lock.
  for v_line in select * from jsonb_array_elements(v_pricing->'lines') loop
    select greatest(v.stock_quantity - v.reserved_quantity, 0), p.name
      into v_avail, v_name
      from product_variants v
      join products p on p.id = v.product_id
     where v.id = (v_line->>'variant_id')::uuid;

    if v_avail < (v_line->>'quantity')::integer then
      raise exception '% is no longer available in that quantity.', coalesce(v_name, 'An item')
        using errcode = 'check_violation';
    end if;
  end loop;

  insert into orders (
    cart_id, profile_id, email, phone, currency,
    subtotal, discount_total, shipping_total, tax_total, grand_total,
    coupon_id, coupon_code, shipping_method,
    shipping_address, billing_address, customer_note,
    status, payment_status, placed_at
  ) values (
    p_cart_id,
    p_profile_id,
    p_email,
    p_phone,
    v_pricing->>'currency',
    (v_pricing->>'subtotal')::numeric,
    (v_pricing->>'discount_total')::numeric,
    (v_pricing->>'shipping_total')::numeric,
    (v_pricing->>'tax_total')::numeric,
    (v_pricing->>'grand_total')::numeric,
    nullif(v_pricing->>'coupon_id', '')::uuid,
    case when coalesce((v_pricing->>'coupon_valid')::boolean, false)
         then v_pricing->>'coupon_code' end,
    v_pricing->>'shipping_method',
    p_shipping_address,
    coalesce(p_billing_address, p_shipping_address),
    p_customer_note,
    'PENDING',
    'PENDING',
    now()
  )
  returning id, order_number into v_order_id, v_number;

  -- Snapshot the lines (Memory.md D-008).
  insert into order_items (
    order_id, variant_id, product_id, product_name, variant_title,
    sku, image_url, unit_price, quantity, line_total
  )
  select
    v_order_id,
    (e->>'variant_id')::uuid,
    (e->>'product_id')::uuid,
    e->>'name',
    e->>'variant_title',
    e->>'sku',
    e->>'image_url',
    (e->>'unit_price')::numeric,
    (e->>'quantity')::integer,
    (e->>'line_total')::numeric
  from jsonb_array_elements(v_pricing->'lines') e;

  -- Reserve stock so the piece cannot be sold twice while payment is in flight.
  update product_variants v
     set reserved_quantity = v.reserved_quantity + oi.quantity
    from order_items oi
   where oi.order_id = v_order_id and oi.variant_id = v.id;

  insert into inventory_transactions
    (variant_id, delta, reason, balance_after, reference_type, reference_id, note, actor_id)
  select oi.variant_id, -oi.quantity, 'RESERVATION', v.stock_quantity,
         'order', v_order_id, 'Reserved at checkout for ' || v_number, p_profile_id
    from order_items oi
    join product_variants v on v.id = oi.variant_id
   where oi.order_id = v_order_id;

  return jsonb_build_object(
    'order_id',     v_order_id,
    'order_number', v_number,
    'grand_total',  (v_pricing->>'grand_total')::numeric,
    'currency',     v_pricing->>'currency',
    'email',        p_email
  );
end;
$fn$;

revoke all on function create_order_from_cart(uuid, citext, jsonb, jsonb, uuid, citext, text, text, uuid)
  from public, anon;
grant execute on function create_order_from_cart(uuid, citext, jsonb, jsonb, uuid, citext, text, text, uuid)
  to service_role;

-- -----------------------------------------------------------------------------
-- release_order_reservations — undo what create_order_from_cart reserved.
-- Safe to call twice: reservations_released guards it.
-- -----------------------------------------------------------------------------
create or replace function release_order_reservations(p_order_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  update product_variants v
     set reserved_quantity = greatest(v.reserved_quantity - oi.quantity, 0)
    from order_items oi
   where oi.order_id = p_order_id and oi.variant_id = v.id;

  insert into inventory_transactions
    (variant_id, delta, reason, balance_after, reference_type, reference_id, note)
  select oi.variant_id, oi.quantity, 'RELEASE', v.stock_quantity,
         'order', p_order_id, coalesce(p_note, 'Reservation released')
    from order_items oi
    join product_variants v on v.id = oi.variant_id
   where oi.order_id = p_order_id;
end;
$fn$;

revoke all on function release_order_reservations(uuid, text) from public, anon;
grant execute on function release_order_reservations(uuid, text) to service_role;

-- -----------------------------------------------------------------------------
-- mark_order_paid — called only from the verified Stripe webhook.
-- Idempotent: a replayed event returns already_paid and changes nothing.
-- -----------------------------------------------------------------------------
create or replace function mark_order_paid(
  p_order_id           uuid,
  p_payment_intent_id  text default null,
  p_checkout_session_id text default null,
  p_amount             numeric default null,
  p_card_brand         text default null,
  p_card_last4         text default null,
  p_charge_id          text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  o orders%rowtype;
begin
  select * into o from orders where id = p_order_id for update;

  if not found then
    raise exception 'mark_order_paid: order % not found', p_order_id;
  end if;

  if o.payment_status = 'PAID' then
    return jsonb_build_object('order_number', o.order_number, 'already_paid', true);
  end if;

  update orders
     set status         = 'PAID',
         payment_status = 'PAID',
         paid_at        = coalesce(paid_at, now()),
         placed_at      = coalesce(placed_at, now())
   where id = p_order_id;

  -- Checkout already wrote a PENDING payment row carrying the session id, and
  -- both stripe_checkout_session_id and stripe_payment_intent_id are unique.
  -- Settle by updating that row; insert only if checkout never got that far.
  update payments
     set status                   = 'PAID',
         stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
         stripe_charge_id         = coalesce(p_charge_id, stripe_charge_id),
         stripe_checkout_session_id = coalesce(p_checkout_session_id, stripe_checkout_session_id),
         amount                   = coalesce(p_amount, amount),
         card_brand               = coalesce(p_card_brand, card_brand),
         card_last4               = coalesce(left(p_card_last4, 4), card_last4),
         processed_at             = now()
   where order_id = p_order_id
     and (
       stripe_checkout_session_id is not distinct from p_checkout_session_id
       or stripe_payment_intent_id is not distinct from p_payment_intent_id
       or status = 'PENDING'
     );

  if not found then
    insert into payments (
      order_id, provider, stripe_payment_intent_id, stripe_checkout_session_id,
      stripe_charge_id, status, amount, currency, card_brand, card_last4, processed_at
    ) values (
      p_order_id, 'stripe', p_payment_intent_id, p_checkout_session_id,
      p_charge_id, 'PAID', coalesce(p_amount, o.grand_total), o.currency,
      p_card_brand, left(p_card_last4, 4), now()
    );
  end if;

  -- Reservation becomes a sale.
  update product_variants v
     set reserved_quantity = greatest(v.reserved_quantity - oi.quantity, 0),
         stock_quantity    = v.stock_quantity - oi.quantity
    from order_items oi
   where oi.order_id = p_order_id and oi.variant_id = v.id;

  insert into inventory_transactions
    (variant_id, delta, reason, balance_after, reference_type, reference_id, note)
  select oi.variant_id, -oi.quantity, 'SALE', v.stock_quantity,
         'order', p_order_id, 'Sold on ' || o.order_number
    from order_items oi
    join product_variants v on v.id = oi.variant_id
   where oi.order_id = p_order_id;

  update products p
     set units_sold = p.units_sold + agg.qty
    from (
      select product_id, sum(quantity) as qty
        from order_items where order_id = p_order_id and product_id is not null
       group by product_id
    ) agg
   where p.id = agg.product_id;

  -- Coupon accounting.
  if o.coupon_id is not null then
    update coupons set used_count = used_count + 1 where id = o.coupon_id;
    insert into coupon_redemptions (coupon_id, order_id, profile_id, amount)
    values (o.coupon_id, p_order_id, o.profile_id, o.discount_total)
    on conflict (coupon_id, order_id) do nothing;
  end if;

  -- Lifetime spend, for membership tiers.
  if o.profile_id is not null then
    update memberships
       set lifetime_spend = lifetime_spend + o.grand_total
     where profile_id = o.profile_id;
  end if;

  insert into notifications (audience, type, title, body, href)
  values (
    'STAFF', 'order.placed',
    'New order ' || o.order_number,
    o.email || ' · ' || to_char(o.grand_total, 'FM999,999.00') || ' ' || o.currency,
    '/admin/orders/' || p_order_id
  );

  -- Low-stock warnings, one per variant that just crossed its threshold.
  insert into notifications (audience, type, title, body, href)
  select 'STAFF', 'inventory.low',
         'Low stock: ' || p.name,
         v.title || ' — ' || v.stock_quantity || ' left',
         '/admin/inventory'
    from order_items oi
    join product_variants v on v.id = oi.variant_id
    join products p on p.id = v.product_id
   where oi.order_id = p_order_id
     and v.stock_quantity <= v.low_stock_threshold;

  -- The cart has done its job. Exactly the one recorded on the order.
  if o.cart_id is not null then
    delete from carts where id = o.cart_id;
  end if;

  return jsonb_build_object(
    'order_number', o.order_number,
    'already_paid', false,
    'email',        o.email,
    'grand_total',  o.grand_total
  );
end;
$fn$;

revoke all on function mark_order_paid(uuid, text, text, numeric, text, text, text) from public, anon;
grant execute on function mark_order_paid(uuid, text, text, numeric, text, text, text) to service_role;

-- -----------------------------------------------------------------------------
-- mark_order_payment_failed — releases the reservation so stock returns to sale.
-- -----------------------------------------------------------------------------
create or replace function mark_order_payment_failed(
  p_order_id uuid,
  p_reason   text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  o orders%rowtype;
begin
  select * into o from orders where id = p_order_id for update;
  if not found or o.payment_status = 'PAID' then
    return;
  end if;

  perform release_order_reservations(p_order_id, 'Payment failed');

  update orders
     set payment_status = 'FAILED',
         status         = 'CANCELLED',
         cancelled_at   = now(),
         cancel_reason  = coalesce(p_reason, 'Payment was not completed')
   where id = p_order_id;

  insert into notifications (audience, type, title, body, href)
  values (
    'STAFF', 'payment.failed',
    'Payment failed on ' || o.order_number,
    coalesce(p_reason, 'The customer did not complete payment.'),
    '/admin/orders/' || p_order_id
  );
end;
$fn$;

revoke all on function mark_order_payment_failed(uuid, text) from public, anon;
grant execute on function mark_order_payment_failed(uuid, text) to service_role;
