-- ============================================
-- Souk El Gomla — Phase 0 Improvements
-- Version: 004
-- Description: Suppliers, purchase orders, inventory movements, returns,
--              feature flags, and extended columns for products/orders/notifications
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

-- Order source (multi-channel)
create type public.order_source as enum ('website', 'mobile', 'admin', 'whatsapp', 'facebook');

-- Payment lifecycle status
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

-- Inventory movement types
create type public.movement_type as enum (
  'purchase',
  'sale',
  'return',
  'adjustment',
  'transfer_in',
  'transfer_out',
  'initial_stock'
);

-- Return lifecycle states
create type public.return_status as enum ('pending', 'approved', 'rejected', 'completed');

-- Purchase order lifecycle states
create type public.purchase_order_status as enum ('draft', 'ordered', 'partial', 'received', 'cancelled');

-- ============================================
-- COLUMN EXTENSIONS
-- ============================================

-- ---- PRODUCTS: slug, display_order, image_alt ----
alter table public.products
  add column if not exists slug text,
  add column if not exists display_order integer not null default 0,
  add column if not exists image_alt text;

create unique index idx_products_slug on public.products(slug) where slug is not null and deleted_at is null;
create index idx_products_display_order on public.products(display_order) where deleted_at is null;

-- ---- ORDERS: source, payment_status ----
-- Existing orders are backfilled as 'admin' source and 'pending' payment status
alter table public.orders
  add column if not exists source public.order_source not null default 'admin',
  add column if not exists payment_status public.payment_status not null default 'pending';

create index idx_orders_source on public.orders(source) where deleted_at is null;
create index idx_orders_payment_status on public.orders(payment_status) where deleted_at is null;

-- ---- NOTIFICATIONS: read_at ----
alter table public.notifications
  add column if not exists read_at timestamptz;

create index idx_notifications_read_at on public.notifications(read_at, created_at desc) where read_at is null;

-- ---- BRANCHES: latitude, longitude (ensure present) ----
alter table public.branches
  add column if not exists latitude numeric(10,7),
  add column if not exists longitude numeric(10,7);

-- ============================================
-- SUPPLIERS
-- ============================================
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  tax_id text,
  payment_terms text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_suppliers_name on public.suppliers(name) where deleted_at is null;
create index idx_suppliers_active on public.suppliers(is_active) where deleted_at is null;
create unique index idx_suppliers_tax_id on public.suppliers(tax_id) where tax_id is not null and deleted_at is null;

-- ============================================
-- PURCHASE ORDERS
-- ============================================
create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text unique not null,          -- PO-YYYYMMDD-000001
  supplier_id uuid references public.suppliers(id) on delete set null,
  status public.purchase_order_status not null default 'draft',
  expected_date date,
  received_date date,
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  tax numeric(10,2) not null default 0 check (tax >= 0),
  discount numeric(10,2) not null default 0 check (discount >= 0),
  total numeric(10,2) not null default 0 check (total >= 0),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_po_supplier on public.purchase_orders(supplier_id) where deleted_at is null;
create index idx_po_status on public.purchase_orders(status) where deleted_at is null;
create index idx_po_created on public.purchase_orders(created_at desc) where deleted_at is null;

-- PO number sequence + trigger
create sequence public.po_sequence start 1;
alter sequence public.po_sequence owner to postgres;

create or replace function public.generate_po_number()
returns trigger as $$
declare
  seq bigint;
  day_part text;
begin
  seq := nextval('public.po_sequence');
  day_part := to_char(now(), 'YYYYMMDD');
  new.po_number := 'PO-' || day_part || '-' || lpad(seq::text, 6, '0');
  return new;
end;
$$ language plpgsql;

create trigger purchase_orders_generate_number
  before insert on public.purchase_orders
  for each row when (new.po_number is null)
  execute function public.generate_po_number();

-- ============================================
-- PURCHASE ORDER ITEMS
-- ============================================
create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(10,2) not null check (unit_cost >= 0),
  total numeric(10,2) not null check (total >= 0),
  created_at timestamptz not null default now()
);
create index idx_po_items_po on public.purchase_order_items(purchase_order_id);
create index idx_po_items_product on public.purchase_order_items(product_id);

-- ============================================
-- INVENTORY MOVEMENTS (immutable audit trail)
-- ============================================
-- Quantity is signed: positive = inbound, negative = outbound
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type public.movement_type not null,
  quantity integer not null check (quantity <> 0),
  reason text,
  reference_type text,           -- 'order', 'purchase_order', 'return', 'adjustment', ...
  reference_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_inventory_movements_product on public.inventory_movements(product_id, created_at desc);
create index idx_inventory_movements_type on public.inventory_movements(movement_type, created_at desc);
create index idx_inventory_movements_reference on public.inventory_movements(reference_type, reference_id);
create index idx_inventory_movements_created on public.inventory_movements(created_at desc);

-- ============================================
-- RETURNS
-- ============================================
create table public.returns (
  id uuid primary key default gen_random_uuid(),
  return_number text unique not null,      -- RT-YYYYMMDD-000001
  order_id uuid references public.orders(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  status public.return_status not null default 'pending',
  reason text,
  total_refund numeric(10,2) not null default 0 check (total_refund >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_returns_order on public.returns(order_id) where deleted_at is null;
create index idx_returns_customer on public.returns(customer_id) where deleted_at is null;
create index idx_returns_status on public.returns(status) where deleted_at is null;
create index idx_returns_created on public.returns(created_at desc) where deleted_at is null;

-- Return number sequence + trigger
create sequence public.return_sequence start 1;
alter sequence public.return_sequence owner to postgres;

create or replace function public.generate_return_number()
returns trigger as $$
declare
  seq bigint;
  day_part text;
begin
  seq := nextval('public.return_sequence');
  day_part := to_char(now(), 'YYYYMMDD');
  new.return_number := 'RT-' || day_part || '-' || lpad(seq::text, 6, '0');
  return new;
end;
$$ language plpgsql;

create trigger returns_generate_number
  before insert on public.returns
  for each row when (new.return_number is null)
  execute function public.generate_return_number();

-- ============================================
-- RETURN ITEMS
-- ============================================
create table public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  total numeric(10,2) not null check (total >= 0),
  created_at timestamptz not null default now()
);
create index idx_return_items_return on public.return_items(return_id);
create index idx_return_items_product on public.return_items(product_id);

-- ============================================
-- FEATURE GROUPS & FLAGS
-- ============================================
create table public.feature_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_feature_groups_active on public.feature_groups(is_active) where deleted_at is null;

create table public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  group_id uuid references public.feature_groups(id) on delete set null,
  label text not null,
  description text,
  is_enabled boolean not null default false,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_feature_flags_group on public.feature_flags(group_id) where deleted_at is null;
create index idx_feature_flags_enabled on public.feature_flags(is_enabled) where deleted_at is null;

-- ============================================
-- INSTANT UPDATES (auto-update updated_at on new tables)
-- ============================================
do $$
declare t text;
begin
  foreach t in array array[
    'suppliers','purchase_orders','returns','feature_groups','feature_flags'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.returns enable row level security;
alter table public.return_items enable row level security;
alter table public.feature_groups enable row level security;
alter table public.feature_flags enable row level security;

-- ---- SUPPLIERS ----
create policy "Suppliers: staff read"
  on public.suppliers for select
  using (public.is_staff());

create policy "Suppliers: manager+ write"
  on public.suppliers for all
  using (public.has_any_role(array['owner','manager']))
  with check (public.has_any_role(array['owner','manager']));

-- ---- PURCHASE ORDERS ----
create policy "PurchaseOrders: staff read"
  on public.purchase_orders for select
  using (public.is_staff());

create policy "PurchaseOrders: manager+ write"
  on public.purchase_orders for all
  using (public.has_any_role(array['owner','manager']))
  with check (public.has_any_role(array['owner','manager']));

-- ---- PURCHASE ORDER ITEMS ----
create policy "PurchaseOrderItems: staff read"
  on public.purchase_order_items for select
  using (public.is_staff());

create policy "PurchaseOrderItems: manager+ write"
  on public.purchase_order_items for all
  using (public.has_any_role(array['owner','manager']))
  with check (public.has_any_role(array['owner','manager']));

-- ---- INVENTORY MOVEMENTS ----
create policy "InventoryMovements: staff read"
  on public.inventory_movements for select
  using (public.is_staff());

create policy "InventoryMovements: staff insert"
  on public.inventory_movements for insert
  with check (public.is_staff());

-- Immutable ledger: no update or delete policies

-- ---- RETURNS ----
create policy "Returns: staff read"
  on public.returns for select
  using (public.is_staff());

create policy "Returns: staff write"
  on public.returns for all
  using (public.is_staff())
  with check (public.is_staff());

-- ---- RETURN ITEMS ----
create policy "ReturnItems: staff read"
  on public.return_items for select
  using (public.is_staff());

create policy "ReturnItems: staff write"
  on public.return_items for all
  using (public.is_staff())
  with check (public.is_staff());

-- ---- FEATURE GROUPS ----
create policy "FeatureGroups: staff read"
  on public.feature_groups for select
  using (public.is_staff());

create policy "FeatureGroups: owner write"
  on public.feature_groups for all
  using (public.has_role('owner'))
  with check (public.has_role('owner'));

-- ---- FEATURE FLAGS ----
create policy "FeatureFlags: staff read"
  on public.feature_flags for select
  using (public.is_staff());

create policy "FeatureFlags: owner write"
  on public.feature_flags for all
  using (public.has_role('owner'))
  with check (public.has_role('owner'));

-- ============================================
-- SEED DATA: FEATURE GROUPS & FLAGS
-- ============================================
insert into public.feature_groups (name, description, sort_order)
values
  ('customer', 'Customer-facing features', 1),
  ('marketing', 'Marketing and promotions', 2),
  ('operations', 'Back-office operations', 3),
  ('ai', 'AI assistant features', 4)
on conflict (name) do nothing;

insert into public.feature_flags (key, group_id, label, description, is_enabled)
select v.key, g.id, v.label, v.description, false
from (values
  ('wishlist', 'قائمة الرغبات', 'Wishlist feature', 'customer'),
  ('reviews', 'التقييمات', 'Product reviews and ratings', 'customer'),
  ('loyalty', 'برنامج الولاء', 'Loyalty points program', 'marketing'),
  ('coupons', 'الكوبونات', 'Coupons and promo codes', 'marketing'),
  ('inventory', 'المخزون', 'Inventory management module', 'operations'),
  ('suppliers', 'الموردين', 'Supplier management module', 'operations'),
  ('purchase_orders', 'أوامر الشراء', 'Purchase orders module', 'operations'),
  ('returns', 'المرتجعات', 'Returns management module', 'operations'),
  ('ai_assistant', 'المساعد الذكي', 'AI assistant features', 'ai')
) as v(key, label, description, group_name)
join public.feature_groups g on g.name = v.group_name
on conflict (key) do nothing;

-- ============================================
-- REALTIME
-- ============================================
alter publication supabase_realtime add table public.inventory_movements;
alter publication supabase_realtime add table public.returns;
alter publication supabase_realtime add table public.purchase_orders;
