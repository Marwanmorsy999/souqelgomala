-- ============================================
-- Souk El Gomla — Initial Schema
-- Version: 001
-- Description: Production-ready foundation for retail operating system
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
create extension if not exists "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

-- User roles (RBAC)
create type public.user_role as enum ('owner', 'manager', 'employee');

-- Order lifecycle states
create type public.order_status as enum (
  'new',
  'accepted',
  'preparing',
  'packed',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

-- Payment methods
create type public.payment_method as enum (
  'cash',
  'card',
  'wallet',
  'bank_transfer'
);

-- Discount types for offers
create type public.discount_type as enum (
  'percentage',
  'fixed_price',
  'buy_x_get_y'
);

-- Product status
create type public.product_status as enum ('active', 'inactive', 'archived');

-- Offer status
create type public.offer_status as enum ('active', 'inactive', 'scheduled', 'expired');

-- Driver availability
create type public.driver_status as enum ('available', 'busy', 'offline');

-- ============================================
-- COLUMN HELPERS (soft-delete + timestamp convention)
-- ============================================

-- Every business table gets:
--   created_at timestamptz default now()
--   updated_at timestamptz default now()
--   deleted_at timestamptz null (soft delete)

-- ============================================
-- BRANCHES
-- ============================================
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  code text unique,
  address text,
  phone text,
  working_hours jsonb default '{}'::jsonb,  -- {"saturday": {"open":"09:00","close":"22:00"}, ...}
  latitude numeric(10,7),
  longitude numeric(10,7),
  google_maps_url text,
  manager_id uuid,  -- FK to profiles (added after profiles table)
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_branches_code on public.branches(code) where deleted_at is null;
create index idx_branches_active on public.branches(is_active) where deleted_at is null;

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  phone text,
  role public.user_role not null default 'employee',
  avatar text,
  branch_id uuid references public.branches(id) on delete set null,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_profiles_role on public.profiles(role) where deleted_at is null;
create index idx_profiles_branch on public.profiles(branch_id) where deleted_at is null;
create index idx_profiles_email on public.profiles(email) where deleted_at is null;

-- Add the branch manager FK now that profiles exists
alter table public.branches
  add constraint branches_manager_id_fkey foreign key (manager_id) references public.profiles(id) on delete set null;

-- ============================================
-- CATEGORIES (unlimited nesting)
-- ============================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  parent_id uuid references public.categories(id) on delete set null,
  image text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_categories_parent on public.categories(parent_id) where deleted_at is null;
create index idx_categories_visible on public.categories(is_visible) where deleted_at is null;

-- Recursive CTE helper for category tree is defined as a function in a later migration

-- ============================================
-- PRODUCTS
-- ============================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  barcode text unique,
  sku text unique,
  name_ar text not null,
  name_en text,
  description text,
  brand text,
  category_id uuid references public.categories(id) on delete set null,
  price numeric(10,2) not null default 0 check (price >= 0),
  offer_price numeric(10,2) check (offer_price is null or offer_price < price),
  cost_price numeric(10,2) check (cost_price is null or cost_price >= 0),
  unit text not null default 'piece',
  weight numeric(10,3),
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 10 check (min_stock >= 0),
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  is_best_seller boolean not null default false,
  is_visible boolean not null default true,
  status public.product_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_products_category on public.products(category_id) where deleted_at is null;
create index idx_products_barcode on public.products(barcode) where deleted_at is null;
create index idx_products_sku on public.products(sku) where deleted_at is null;
create index idx_products_status on public.products(status) where deleted_at is null;
create index idx_products_stock on public.products(stock) where deleted_at is null;
create index idx_products_brand on public.products(brand) where deleted_at is null;

-- Partial indexes for low-stock alerts and featured products
create index idx_products_low_stock on public.products(id) where stock <= min_stock and status = 'active' and deleted_at is null;
create index idx_products_featured on public.products(id) where is_featured = true and is_visible = true and deleted_at is null;

-- Product name search index (trigram)
create extension if not exists pg_trgm;
create index idx_products_name_ar_trgm on public.products using gin (name_ar gin_trgm_ops) where deleted_at is null;
create index idx_products_name_en_trgm on public.products using gin (name_en gin_trgm_ops) where deleted_at is null;

-- ============================================
-- PRODUCT IMAGES (gallery)
-- ============================================
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_product_images_product on public.product_images(product_id) where deleted_at is null;

-- ============================================
-- PRODUCT TAGS
-- ============================================
create table public.product_tags (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now()
);
create index idx_product_tags_product on public.product_tags(product_id);
create index idx_product_tags_tag on public.product_tags(tag);

-- ============================================
-- CUSTOMERS
-- ============================================
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text,
  email text,
  total_spending numeric(12,2) not null default 0 check (total_spending >= 0),
  average_order numeric(10,2) not null default 0 check (average_order >= 0),
  order_count integer not null default 0 check (order_count >= 0),
  is_vip boolean not null default false,
  is_blacklisted boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_customers_phone on public.customers(phone) where deleted_at is null;
create index idx_customers_vip on public.customers(is_vip) where deleted_at is null;
create index idx_customers_name on public.customers(name) where deleted_at is null;

-- ============================================
-- CUSTOMER ADDRESSES
-- ============================================
create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text,
  city text not null,
  address text not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_customer_addresses_customer on public.customer_addresses(customer_id) where deleted_at is null;

-- ============================================
-- ORDERS (Heart of the System)
-- ============================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,          -- SG-YYYYMMDD-000001
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,                          -- snapshot at order time
  customer_phone text,
  customer_address text,
  branch_id uuid references public.branches(id) on delete set null,
  status public.order_status not null default 'new',
  payment_method public.payment_method,
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  discount numeric(10,2) not null default 0 check (discount >= 0),
  delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  total numeric(10,2) not null default 0 check (total >= 0),
  driver_id uuid,
  assigned_driver_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_orders_status on public.orders(status) where deleted_at is null;
create index idx_orders_created on public.orders(created_at desc) where deleted_at is null;
create index idx_orders_customer on public.orders(customer_id) where deleted_at is null;
create index idx_orders_driver on public.orders(driver_id) where deleted_at is null;
create index idx_orders_branch on public.orders(branch_id) where deleted_at is null;
create index idx_orders_order_number on public.orders(order_number) where deleted_at is null;
create index idx_orders_updated on public.orders(updated_at desc) where deleted_at is null;

-- ============================================
-- ORDER ITEMS
-- ============================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name_ar text not null,          -- snapshot
  name_en text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  total numeric(10,2) not null check (total >= 0),
  created_at timestamptz not null default now()
);
create index idx_order_items_order on public.order_items(order_id);
create index idx_order_items_product on public.order_items(product_id);

-- ============================================
-- ORDER STATUS HISTORY (immutable audit trail)
-- ============================================
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index idx_order_history_order on public.order_status_history(order_id, created_at);

-- ============================================
-- ORDER TIMELINE (events/notes/activities)
-- ============================================
create table public.order_timeline (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  type text not null,        -- status_change, note, driver_assigned, payment, etc.
  note text,
  actor_id uuid references public.profiles(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index idx_order_timeline_order on public.order_timeline(order_id, created_at);

-- ============================================
-- OFFERS & PROMOTIONS
-- ============================================
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  banner text,
  campaign_name text not null,
  discount_type public.discount_type not null,
  value numeric(10,2),                 -- % or fixed amount
  buy_x integer,                       -- buy X get Y
  get_y integer,                       -- buy X get Y
  product_ids uuid[] default '{}',
  start_date timestamptz not null,
  end_date timestamptz not null,
  status public.offer_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_offers_status on public.offers(status) where deleted_at is null;
create index idx_offers_dates on public.offers(start_date, end_date) where deleted_at is null;
create index idx_offers_active on public.offers(id) where status = 'active' and start_date <= now() and end_date >= now() and deleted_at is null;

-- ============================================
-- DELIVERY DRIVERS
-- ============================================
create table public.delivery_drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  vehicle text,
  branch_id uuid references public.branches(id) on delete set null,
  status public.driver_status not null default 'available',
  current_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_delivery_drivers_branch on public.delivery_drivers(branch_id) where deleted_at is null;
create index idx_delivery_drivers_status on public.delivery_drivers(status) where deleted_at is null;

-- ============================================
-- DELIVERY AREAS
-- ============================================
create table public.delivery_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  fee numeric(10,2) not null default 0 check (fee >= 0),
  min_order numeric(10,2) not null default 0 check (min_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_delivery_areas_city on public.delivery_areas(city) where deleted_at is null;
create index idx_delivery_areas_active on public.delivery_areas(is_active) where deleted_at is null;

-- ============================================
-- DELIVERY ASSIGNMENTS (history)
-- ============================================
create table public.delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  driver_id uuid references public.delivery_drivers(id) on delete set null,
  assigned_by uuid references public.profiles(id) on delete set null,
  status text not null default 'assigned' check (status in ('assigned', 'picked_up', 'delivered', 'returned')),
  notes text,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_delivery_assignments_order on public.delivery_assignments(order_id);
create index idx_delivery_assignments_driver on public.delivery_assignments(driver_id);

-- ============================================
-- ACTIVITY / AUDIT LOGS
-- ============================================
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,        -- e.g. 'order.status_changed', 'product.updated'
  entity text not null,        -- 'order', 'product', 'customer', ...
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index idx_activity_logs_user on public.activity_logs(user_id);
create index idx_activity_logs_entity on public.activity_logs(entity, entity_id);
create index idx_activity_logs_created on public.activity_logs(created_at desc);
create index idx_activity_logs_action on public.activity_logs(action, created_at desc);

-- ============================================
-- NOTIFICATIONS (system & user)
-- ============================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,  -- null = broadcast to all
  type text not null,          -- low_stock, new_order, cancelled_order, offer_ending, delivery_delay, system
  title text not null,
  body text,
  severity text not null default 'info' check (severity in ('info', 'warning', 'error', 'success')),
  is_read boolean not null default false,
  entity text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, is_read);
create index idx_notifications_type on public.notifications(type, created_at desc);
create index idx_notifications_created on public.notifications(created_at desc);

-- ============================================
-- SETTINGS (key-value store)
-- ============================================
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- INSTANT UPDATES (auto-update updated_at)
-- ============================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
do $$
declare t text;
begin
  foreach t in array array[
    'branches','profiles','categories','products','customers',
    'customer_addresses','orders','delivery_drivers','delivery_areas',
    'offers'
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
-- ORDER NUMBER SEQUENCE
-- ============================================
-- Generates order numbers in format: SG-YYYYMMDD-000001
create sequence public.order_sequence start 1;

alter sequence public.order_sequence owner to postgres;

create or replace function public.generate_order_number()
returns trigger as $$
declare
  seq bigint;
  day_part text;
begin
  seq := nextval('public.order_sequence');
  day_part := to_char(now(), 'YYYYMMDD');
  new.order_number := 'SG-' || day_part || '-' || lpad(seq::text, 6, '0');
  return new;
end;
$$ language plpgsql;

create trigger orders_generate_number
  before insert on public.orders
  for each row when (new.order_number is null)
  execute function public.generate_order_number();

-- ============================================
-- CUSTOMER METRICS UPDATE (on order insert/update)
-- ============================================
create or replace function public.recalculate_customer_metrics()
returns trigger as $$
declare
  agg record;
begin
  select
    count(*) as order_count,
    coalesce(sum(total), 0) as total_spending,
    coalesce(round(avg(total)::numeric, 2), 0) as average_order
  into agg
  from public.orders
  where customer_id = coalesce(new.customer_id, old.customer_id)
    and status <> 'cancelled'
    and deleted_at is null;

  update public.customers
  set total_spending = agg.total_spending,
      average_order  = agg.average_order,
      order_count    = agg.order_count,
      updated_at     = now()
  where id = coalesce(new.customer_id, old.customer_id);

  return null;
end;
$$ language plpgsql;

create trigger trg_orders_recalc_customer
  after insert or update of customer_id, total, status on public.orders
  for each row
  execute function public.recalculate_customer_metrics();

-- ============================================
-- ACTIVITY LOG HELPER
-- ============================================
create or replace function public.log_activity(
  p_action text,
  p_entity text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void as $$
begin
  insert into public.activity_logs (user_id, action, entity, entity_id, metadata)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_metadata);
end;
$$ language plpgsql security definer;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Helper: is the requesting user an active staff member?
create or replace function public.is_staff()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and deleted_at is null
  );
$$ language sql security definer stable;

-- Helper: requesting user has a given role
create or replace function public.has_role(p_role public.user_role)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = p_role and is_active = true and deleted_at is null
  );
$$ language sql security definer stable;

-- Helper: requesting user has one of given roles
create or replace function public.has_any_role(p_roles public.user_role[])
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = any(p_roles) and is_active = true and deleted_at is null
  );
$$ language sql security definer stable;

-- ============================================
-- Enable RLS on all business tables
-- ============================================
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_tags enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_timeline enable row level security;
alter table public.offers enable row level security;
alter table public.delivery_drivers enable row level security;
alter table public.delivery_areas enable row level security;
alter table public.delivery_assignments enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;

-- ============================================
-- RLS POLICIES
-- ============================================

-- ---- PROFILES ----
-- Users can read their own profile; staff can read all; owner can manage
create policy "Profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles: staff read all"
  on public.profiles for select
  using (public.is_staff());

create policy "Profiles: owner manage all"
  on public.profiles for all
  using (public.has_role('owner'));

create policy "Profiles: user update self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and
    (role = (select role from public.profiles where id = auth.uid())));  -- can't change own role

-- ---- BRANCHES ----
create policy "Branches: staff read"
  on public.branches for select
  using (public.is_staff());

create policy "Branches: manager+ write"
  on public.branches for all
  using (public.has_any_role(array['owner','manager']))
  with check (public.has_any_role(array['owner','manager']));

-- ---- CATEGORIES ----
create policy "Categories: staff read"
  on public.categories for select
  using (public.is_staff());

create policy "Categories: manager+ write"
  on public.categories for all
  using (public.has_any_role(array['owner','manager']))
  with check (public.has_any_role(array['owner','manager']));

-- ---- PRODUCTS ----
create policy "Products: staff read"
  on public.products for select
  using (public.is_staff());

create policy "Products: manager+ insert"
  on public.products for insert
  with check (public.has_any_role(array['owner','manager']));

create policy "Products: manager+ update"
  on public.products for update
  using (public.has_any_role(array['owner','manager']))
  with check (public.has_any_role(array['owner','manager']));

create policy "Products: manager+ delete"
  on public.products for delete
  using (public.has_any_role(array['owner','manager']));

-- ---- PRODUCT IMAGES ----
create policy "ProductImages: staff read"
  on public.product_images for select
  using (public.is_staff());

create policy "ProductImages: manager+ write"
  on public.product_images for all
  using (public.has_any_role(array['owner','manager']))
  with check (public.has_any_role(array['owner','manager']));

-- ---- PRODUCT TAGS ----
create policy "ProductTags: staff read"
  on public.product_tags for select
  using (public.is_staff());

create policy "ProductTags: manager+ write"
  on public.product_tags for all
  using (public.has_any_role(array['owner','manager']))
  with check (public.has_any_role(array['owner','manager']));

-- ---- CUSTOMERS ----
create policy "Customers: staff read"
  on public.customers for select
  using (public.is_staff());

create policy "Customers: staff write"
  on public.customers for all
  using (public.is_staff())
  with check (public.is_staff());

-- ---- CUSTOMER ADDRESSES ----
create policy "CustomerAddresses: staff read"
  on public.customer_addresses for select
  using (public.is_staff());

create policy "CustomerAddresses: staff write"
  on public.customer_addresses for all
  using (public.is_staff())
  with check (public.is_staff());

-- ---- ORDERS ----
create policy "Orders: staff read"
  on public.orders for select
  using (public.is_staff());

create policy "Orders: staff insert"
  on public.orders for insert
  with check (public.is_staff());

create policy "Orders: staff update"
  on public.orders for update
  using (public.is_staff())
  with check (public.is_staff());

-- ---- ORDER ITEMS ----
create policy "OrderItems: staff read"
  on public.order_items for select
  using (public.is_staff());

create policy "OrderItems: staff write"
  on public.order_items for all
  using (public.is_staff())
  with check (public.is_staff());

-- ---- ORDER STATUS HISTORY ----
create policy "OrderHistory: staff read"
  on public.order_status_history for select
  using (public.is_staff());

create policy "OrderHistory: staff insert"
  on public.order_status_history for insert
  with check (public.is_staff());

-- Immutable: no update or delete policies

-- ---- ORDER TIMELINE ----
create policy "OrderTimeline: staff read"
  on public.order_timeline for select
  using (public.is_staff());

create policy "OrderTimeline: staff insert"
  on public.order_timeline for insert
  with check (public.is_staff());

-- ---- OFFERS ----
create policy "Offers: staff read"
  on public.offers for select
  using (public.is_staff());

create policy "Offers: manager+ write"
  on public.offers for all
  using (public.has_any_role(array['owner','manager']))
  with check (public.has_any_role(array['owner','manager']));

-- ---- DELIVERY DRIVERS ----
create policy "Drivers: staff read"
  on public.delivery_drivers for select
  using (public.is_staff());

create policy "Drivers: manager+ write"
  on public.delivery_drivers for all
  using (public.has_any_role(array['owner','manager']))
  with check (public.has_any_role(array['owner','manager']));

-- ---- DELIVERY AREAS ----
create policy "Areas: staff read"
  on public.delivery_areas for select
  using (public.is_staff());

create policy "Areas: manager+ write"
  on public.delivery_areas for all
  using (public.has_any_role(array['owner','manager']))
  with check (public.has_any_role(array['owner','manager']));

-- ---- DELIVERY ASSIGNMENTS ----
create policy "Assignments: staff read"
  on public.delivery_assignments for select
  using (public.is_staff());

create policy "Assignments: manager+ write"
  on public.delivery_assignments for all
  using (public.has_any_role(array['owner','manager']))
  with check (public.has_any_role(array['owner','manager']));

-- ---- ACTIVITY LOGS ----
create policy "ActivityLogs: staff read"
  on public.activity_logs for select
  using (public.is_staff());

create policy "ActivityLogs: system insert"
  on public.activity_logs for insert
  with check (public.is_staff());

-- ---- NOTIFICATIONS ----
create policy "Notifications: read own"
  on public.notifications for select
  using (user_id = auth.uid() or user_id is null);

create policy "Notifications: update own"
  on public.notifications for update
  using (user_id = auth.uid());

-- ============================================
-- REALTIME
-- ============================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_status_history;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.activity_logs;
alter publication supabase_realtime add table public.notifications;
