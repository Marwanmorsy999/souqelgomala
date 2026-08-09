# Supabase Setup

This directory contains everything needed to set up the Souk El Gomla database.

## Prerequisites

- Supabase project (create at [supabase.com](https://supabase.com))
- Supabase CLI installed: `npm install -g supabase`

## Setup

### 1. Link your project

```bash
supabase link --project-ref <your-project-ref>
```

### 2. Apply migrations

```bash
supabase db push
```

### 3. Create the admin user

The seed data creates branches, categories, products, etc. but does NOT create auth users
(that requires the auth service). Create your admin user via the Supabase dashboard:

1. Go to **Authentication → Users → Add user**
2. Create the owner account (e.g., `admin@soukelgomla.com`)
3. In **SQL Editor**, set the role:

```sql
insert into public.profiles (id, email, full_name, role)
values (
  (select id from auth.users where email = 'admin@soukelgomla.com'),
  'admin@soukelgomla.com',
  'مدير النظام',
  'owner'
)
on conflict (id) do update set role = 'owner';
```

### 4. Storage buckets

Create the required storage buckets:

```bash
supabase storage create products
supabase storage create categories
supabase storage create offers
supabase storage create profiles
supabase storage create branches
```

Set each bucket to **public** (for product images served to customers) with policies:

```sql
-- Allow authenticated staff to upload
create policy "Staff can upload product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'products'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  )
);

-- Allow public read of product images
create policy "Public can read product images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'products');
```

### 5. Generate TypeScript types (recommended)

```bash
supabase gen types typescript --project-id <your-project-ref> > src/types/database.generated.ts
```

This replaces the placeholder `src/types/database.generated.ts`.

### 6. Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-only, never exposed
```

## Realtime

Realtime is already enabled on:
- `orders`
- `order_status_history`
- `products`
- `activity_logs`
- `notifications`

## Schema Overview

| Domain | Tables |
|--------|--------|
| Auth & Staff | `profiles`, `branches` |
| Catalog | `categories`, `products`, `product_images`, `product_tags` |
| CRM | `customers`, `customer_addresses` |
| Orders | `orders`, `order_items`, `order_status_history`, `order_timeline` |
| Marketing | `offers` |
| Delivery | `delivery_drivers`, `delivery_areas`, `delivery_assignments` |
| System | `activity_logs`, `notifications`, `settings` |

