-- =============================================================================
-- 0007 · Reporting views and callable functions
-- =============================================================================

-- Storefront product list shape: one row per active product with its primary
-- image, price range and stock rollup. Keeps list queries to a single scan.
create or replace view product_cards
with (security_invoker = true)
as
select
  p.id,
  p.name,
  p.slug,
  p.subtitle,
  p.price,
  p.compare_at_price,
  p.currency,
  p.badge,
  p.is_featured,
  p.is_new,
  p.is_limited,
  p.is_members_only,
  p.rating_average,
  p.rating_count,
  p.units_sold,
  p.tags,
  p.published_at,
  p.created_at,
  img.url  as image_url,
  img.alt  as image_alt,
  img.blur_data,
  coalesce(stock.total_available, 0)              as available_quantity,
  coalesce(stock.total_available, 0) > 0          as is_in_stock,
  cat.name as primary_category,
  cat.slug as primary_category_slug
from products p
left join lateral (
  select pi.url, pi.alt, pi.blur_data
  from product_images pi
  where pi.product_id = p.id
  order by pi.is_primary desc, pi.position
  limit 1
) img on true
left join lateral (
  select sum(greatest(v.stock_quantity - v.reserved_quantity, 0))::int as total_available
  from product_variants v
  where v.product_id = p.id and v.is_active
) stock on true
left join lateral (
  select c.name, c.slug
  from product_categories pc
  join categories c on c.id = pc.category_id
  where pc.product_id = p.id
  order by pc.is_primary desc
  limit 1
) cat on true
where p.status = 'ACTIVE';

comment on view product_cards is 'Storefront list projection. security_invoker means RLS on products still applies.';

-- Variants at or below their low-stock threshold, for the admin dashboard.
create or replace view low_stock_variants
with (security_invoker = true)
as
select
  v.id           as variant_id,
  v.sku,
  v.title        as variant_title,
  v.stock_quantity,
  v.reserved_quantity,
  greatest(v.stock_quantity - v.reserved_quantity, 0) as available_quantity,
  v.low_stock_threshold,
  p.id           as product_id,
  p.name         as product_name,
  p.slug         as product_slug
from product_variants v
join products p on p.id = v.product_id
where v.is_active
  and p.status <> 'ARCHIVED'
  and v.stock_quantity <= v.low_stock_threshold;

-- Daily revenue for the dashboard chart.
create or replace view daily_revenue
with (security_invoker = true)
as
select
  date_trunc('day', o.paid_at)::date as day,
  count(*)                            as order_count,
  sum(o.grand_total)                  as revenue,
  sum(o.grand_total - o.refunded_total) as net_revenue,
  avg(o.grand_total)                  as average_order_value
from orders o
where o.paid_at is not null
  and o.status not in ('CANCELLED')
group by 1;

-- Sales by category.
create or replace view category_sales
with (security_invoker = true)
as
select
  c.id       as category_id,
  c.name     as category_name,
  c.slug     as category_slug,
  count(distinct o.id) as order_count,
  sum(oi.quantity)     as units_sold,
  sum(oi.line_total)   as revenue
from order_items oi
join orders o             on o.id = oi.order_id and o.paid_at is not null
join product_categories pc on pc.product_id = oi.product_id and pc.is_primary
join categories c          on c.id = pc.category_id
group by 1, 2, 3;

-- -----------------------------------------------------------------------------
-- Inventory adjustment. The only supported way to change stock — it writes the
-- ledger row and the balance in one transaction (Memory.md D-004).
-- -----------------------------------------------------------------------------
create or replace function adjust_inventory(
  p_variant_id     uuid,
  p_delta          integer,
  p_reason         inventory_reason,
  p_note           text default null,
  p_reference_type text default null,
  p_reference_id   uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_delta = 0 then
    raise exception 'adjust_inventory: delta must be non-zero';
  end if;

  update product_variants
     set stock_quantity = stock_quantity + p_delta
   where id = p_variant_id
  returning stock_quantity into v_balance;

  if not found then
    raise exception 'adjust_inventory: variant % not found', p_variant_id;
  end if;

  insert into inventory_transactions
    (variant_id, delta, reason, balance_after, note, reference_type, reference_id, actor_id)
  values
    (p_variant_id, p_delta, p_reason, v_balance, p_note, p_reference_type, p_reference_id, auth.uid());

  return v_balance;
end;
$$;

revoke all on function adjust_inventory(uuid, integer, inventory_reason, text, text, uuid) from public, anon;
grant execute on function adjust_inventory(uuid, integer, inventory_reason, text, text, uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Coupon validation. Returns a single row describing whether the code applies
-- and, if so, what it is worth. Called from a Server Action, never trusted
-- from the client (Agents.md rule 3).
-- -----------------------------------------------------------------------------
create or replace function validate_coupon(
  p_code     citext,
  p_subtotal numeric,
  p_profile  uuid default null
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
as $$
declare
  c coupons%rowtype;
  used_by_customer integer;
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
       or not exists (select 1 from memberships m where m.profile_id = p_profile and m.status = 'ACTIVE')
     ) then
    return query select false, c.id, 'This code is reserved for members.', 0::numeric, false;
    return;
  end if;

  amount := case c.discount_type
    when 'PERCENTAGE'    then round(p_subtotal * c.value / 100.0, 2)
    when 'FIXED_AMOUNT'  then least(c.value, p_subtotal)
    else 0
  end;

  if c.maximum_discount is not null then
    amount := least(amount, c.maximum_discount);
  end if;

  return query select true, c.id, null::text, amount, (c.discount_type = 'FREE_SHIPPING');
end;
$$;

grant execute on function validate_coupon(citext, numeric, uuid) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Related products: manual relations first, then same-category best sellers.
-- -----------------------------------------------------------------------------
create or replace function related_products(p_product_id uuid, p_limit integer default 4)
returns setof product_cards
language sql
stable
as $$
  with manual as (
    select pc.*, 0 as rank_group, pr.position as ord
    from product_relations pr
    join product_cards pc on pc.id = pr.related_id
    where pr.product_id = p_product_id and pr.kind = 'RELATED'
  ),
  same_category as (
    select pc.*, 1 as rank_group, 0 as ord
    from product_cards pc
    where pc.id <> p_product_id
      and pc.primary_category_slug = (
        select primary_category_slug from product_cards where id = p_product_id
      )
      and pc.id not in (select id from manual)
    order by pc.units_sold desc
    limit p_limit
  )
  select id, name, slug, subtitle, price, compare_at_price, currency, badge,
         is_featured, is_new, is_limited, is_members_only, rating_average,
         rating_count, units_sold, tags, published_at, created_at, image_url,
         image_alt, blur_data, available_quantity, is_in_stock,
         primary_category, primary_category_slug
  from (select * from manual union all select * from same_category) t
  order by rank_group, ord
  limit p_limit;
$$;

grant execute on function related_products(uuid, integer) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Frequently bought together, derived from actual order history.
-- -----------------------------------------------------------------------------
create or replace function frequently_bought_together(p_product_id uuid, p_limit integer default 3)
returns setof product_cards
language sql
stable
as $$
  select pc.*
  from order_items a
  join order_items b on b.order_id = a.order_id and b.product_id <> a.product_id
  join product_cards pc on pc.id = b.product_id
  where a.product_id = p_product_id
  group by pc.id, pc.name, pc.slug, pc.subtitle, pc.price, pc.compare_at_price,
           pc.currency, pc.badge, pc.is_featured, pc.is_new, pc.is_limited,
           pc.is_members_only, pc.rating_average, pc.rating_count, pc.units_sold,
           pc.tags, pc.published_at, pc.created_at, pc.image_url, pc.image_alt,
           pc.blur_data, pc.available_quantity, pc.is_in_stock,
           pc.primary_category, pc.primary_category_slug
  order by count(*) desc
  limit p_limit;
$$;

grant execute on function frequently_bought_together(uuid, integer) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Dashboard summary in one round trip.
-- -----------------------------------------------------------------------------
create or replace function admin_dashboard_summary(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
  since timestamptz := now() - make_interval(days => p_days);
begin
  if not is_staff() then
    raise exception 'admin_dashboard_summary: forbidden';
  end if;

  select jsonb_build_object(
    'revenue',        coalesce((select sum(grand_total - refunded_total) from orders where paid_at >= since), 0),
    'order_count',    (select count(*) from orders where created_at >= since),
    'customer_count', (select count(*) from profiles where role = 'CUSTOMER' and created_at >= since),
    'aov',            coalesce((select avg(grand_total) from orders where paid_at >= since), 0),
    'units_sold',     coalesce((select sum(oi.quantity) from order_items oi
                                join orders o on o.id = oi.order_id
                                where o.paid_at >= since), 0),
    'pending_orders', (select count(*) from orders where status = 'PENDING'),
    'low_stock',      (select count(*) from low_stock_variants),
    'conversion_rate', (
      select case when sessions = 0 then 0 else round(purchases::numeric / sessions * 100, 2) end
      from (
        select
          count(distinct session_id) filter (where name = 'session_start') as sessions,
          count(*) filter (where name = 'purchase') as purchases
        from analytics_events where created_at >= since
      ) s
    )
  ) into result;

  return result;
end;
$$;

grant execute on function admin_dashboard_summary(integer) to authenticated, service_role;
