-- =============================================================================
-- 0004 · Commerce: inventory ledger, carts, orders, payments, shipments
-- =============================================================================

create table inventory_transactions (
  id          uuid primary key default gen_random_uuid(),
  variant_id  uuid not null references product_variants(id) on delete cascade,
  delta       integer not null,
  reason      inventory_reason not null,
  balance_after integer not null,
  reference_type text,                      -- 'order', 'manual', 'return'
  reference_id   uuid,
  note        text,
  actor_id    uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint inventory_delta_nonzero check (delta <> 0)
);

comment on table inventory_transactions is 'Immutable ledger (Memory.md D-004). Never updated, never deleted — corrections are new rows.';

create index inventory_tx_variant_idx  on inventory_transactions (variant_id, created_at desc);
create index inventory_tx_reference_idx on inventory_transactions (reference_type, reference_id);
create index inventory_tx_created_idx   on inventory_transactions (created_at desc);

-- -----------------------------------------------------------------------------
-- Carts. Exactly one of profile_id / session_token identifies the owner.
-- -----------------------------------------------------------------------------

create table carts (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid references profiles(id) on delete cascade,
  session_token  text unique,                -- anonymous guest cookie
  currency       char(3) not null default 'USD',
  coupon_id      uuid,                       -- FK added in 0005 (coupons)
  note           text,
  expires_at     timestamptz not null default (now() + interval '30 days'),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint carts_owner_present check (profile_id is not null or session_token is not null)
);

create unique index carts_one_active_per_profile on carts (profile_id) where profile_id is not null;
create index carts_expires_idx on carts (expires_at);

create trigger carts_set_updated_at
  before update on carts
  for each row execute function set_updated_at();

create table cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references carts(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  quantity   integer not null default 1,
  added_at   timestamptz not null default now(),
  unique (cart_id, variant_id),
  constraint cart_items_qty_positive check (quantity > 0 and quantity <= 99)
);

comment on table cart_items is 'No price column by design — price is always read live from the variant (Agents.md rule 3).';

create index cart_items_cart_idx on cart_items (cart_id);

-- -----------------------------------------------------------------------------
-- Orders
-- -----------------------------------------------------------------------------

create sequence order_number_seq start 1000;

create table orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null unique default ('BR-' || lpad(nextval('order_number_seq')::text, 6, '0')),
  profile_id          uuid references profiles(id) on delete set null,
  email               citext not null,
  phone               text,
  status              order_status not null default 'PENDING',
  fulfillment_status  fulfillment_status not null default 'UNFULFILLED',
  payment_status      payment_status not null default 'PENDING',
  currency            char(3) not null default 'USD',

  subtotal            numeric(12,2) not null default 0,
  discount_total      numeric(12,2) not null default 0,
  shipping_total      numeric(12,2) not null default 0,
  tax_total           numeric(12,2) not null default 0,
  grand_total         numeric(12,2) not null default 0,
  refunded_total      numeric(12,2) not null default 0,

  coupon_id           uuid,                  -- FK added in 0005
  coupon_code         text,                  -- snapshot
  shipping_method     text,
  tracking_number     text,
  tracking_url        text,
  carrier             text,

  -- Address snapshots. An order is a historical record (Memory.md D-008).
  shipping_address    jsonb,
  billing_address     jsonb,

  customer_note       text,
  internal_note       text,
  cancel_reason       text,

  placed_at           timestamptz,
  paid_at             timestamptz,
  shipped_at          timestamptz,
  delivered_at        timestamptz,
  cancelled_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint orders_totals_nonneg check (
    subtotal >= 0 and discount_total >= 0 and shipping_total >= 0
    and tax_total >= 0 and grand_total >= 0 and refunded_total >= 0
  ),
  constraint orders_refund_lte_total check (refunded_total <= grand_total)
);

create index orders_profile_idx  on orders (profile_id, created_at desc);
create index orders_status_idx   on orders (status, created_at desc);
create index orders_payment_idx  on orders (payment_status);
create index orders_email_idx    on orders (email);
create index orders_created_idx  on orders (created_at desc);
create index orders_number_trgm  on orders using gin (order_number gin_trgm_ops);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  variant_id    uuid references product_variants(id) on delete set null,
  product_id    uuid references products(id) on delete set null,
  -- Snapshots: editing a product must not rewrite history (Memory.md D-008).
  product_name  text not null,
  variant_title text,
  sku           text,
  image_url     text,
  unit_price    numeric(12,2) not null,
  quantity      integer not null,
  discount_total numeric(12,2) not null default 0,
  tax_total     numeric(12,2) not null default 0,
  line_total    numeric(12,2) not null,
  created_at    timestamptz not null default now(),
  constraint order_items_qty_positive check (quantity > 0),
  constraint order_items_price_nonneg check (unit_price >= 0 and line_total >= 0)
);

create index order_items_order_idx   on order_items (order_id);
create index order_items_product_idx on order_items (product_id);
create index order_items_variant_idx on order_items (variant_id);

-- -----------------------------------------------------------------------------
-- Payments. No card data is ever stored (PRD FR-C5).
-- -----------------------------------------------------------------------------

create table payments (
  id                        uuid primary key default gen_random_uuid(),
  order_id                  uuid not null references orders(id) on delete cascade,
  provider                  text not null default 'stripe',
  stripe_payment_intent_id  text unique,
  stripe_checkout_session_id text unique,
  stripe_charge_id          text,
  status                    payment_status not null default 'PENDING',
  amount                    numeric(12,2) not null,
  amount_refunded           numeric(12,2) not null default 0,
  currency                  char(3) not null default 'USD',
  card_brand                text,            -- display only, from Stripe
  card_last4                char(4),         -- display only, from Stripe
  failure_code              text,
  failure_message           text,
  processed_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint payments_amount_nonneg check (amount >= 0 and amount_refunded >= 0),
  constraint payments_refund_lte    check (amount_refunded <= amount)
);

comment on table payments is 'Stripe references only. Storing a PAN here would be a PCI violation and is impossible by schema.';

create index payments_order_idx  on payments (order_id);
create index payments_status_idx on payments (status);

create trigger payments_set_updated_at
  before update on payments
  for each row execute function set_updated_at();

create table refunds (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders(id) on delete cascade,
  payment_id        uuid references payments(id) on delete set null,
  stripe_refund_id  text unique,
  amount            numeric(12,2) not null,
  reason            text,
  note              text,
  actor_id          uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  constraint refunds_amount_positive check (amount > 0)
);

create index refunds_order_idx on refunds (order_id);

-- -----------------------------------------------------------------------------
-- Shipments
-- -----------------------------------------------------------------------------

create table shipments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  carrier         text,
  service         text,
  tracking_number text,
  tracking_url    text,
  status          text not null default 'PENDING',
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index shipments_order_idx on shipments (order_id);

create trigger shipments_set_updated_at
  before update on shipments
  for each row execute function set_updated_at();

create table shipment_items (
  shipment_id   uuid not null references shipments(id) on delete cascade,
  order_item_id uuid not null references order_items(id) on delete cascade,
  quantity      integer not null,
  primary key (shipment_id, order_item_id),
  constraint shipment_items_qty_positive check (quantity > 0)
);

-- -----------------------------------------------------------------------------
-- Shipping methods (rates the storefront offers at checkout)
-- -----------------------------------------------------------------------------

create table shipping_methods (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  description         text,
  price               numeric(12,2) not null default 0,
  free_over           numeric(12,2),          -- free when subtotal exceeds this
  min_delivery_days   integer,
  max_delivery_days   integer,
  country_codes       char(2)[] not null default '{}',  -- empty = everywhere
  is_active           boolean not null default true,
  position            integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint shipping_price_nonneg check (price >= 0)
);

create trigger shipping_methods_set_updated_at
  before update on shipping_methods
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Stripe webhook idempotency (Memory.md D-007)
-- -----------------------------------------------------------------------------

create table webhook_events (
  id           text primary key,             -- Stripe event id, e.g. evt_...
  provider     text not null default 'stripe',
  type         text not null,
  payload      jsonb,
  processed_at timestamptz not null default now(),
  error        text
);

create index webhook_events_type_idx on webhook_events (type, processed_at desc);
