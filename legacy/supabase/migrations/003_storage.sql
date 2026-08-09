-- ============================================
-- Souk El Gomla — Storage Buckets & Policies
-- Version: 003
-- Description: Creates storage buckets and access policies
-- ============================================

-- ============================================
-- CREATE BUCKETS
-- ============================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products', 'products', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('categories', 'categories', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('offers', 'offers', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('profiles', 'profiles', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('branches', 'branches', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Helper: storage uploads require an active staff member
create or replace function public.can_upload_to_storage()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and deleted_at is null
  );
$$ language sql security definer stable;

-- Read: public read for all image buckets (products served to customers)
drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  to public
  using (bucket_id in ('products', 'categories', 'offers', 'profiles', 'branches'));

-- Write: authenticated staff can upload to any bucket
drop policy if exists "Staff upload images" on storage.objects;
create policy "Staff upload images"
  on storage.objects for insert
  to authenticated
  with check (public.can_upload_to_storage());

-- Update: authenticated staff can update objects
drop policy if exists "Staff update images" on storage.objects;
create policy "Staff update images"
  on storage.objects for update
  to authenticated
  using (public.can_upload_to_storage())
  with check (public.can_upload_to_storage());

-- Delete: managers+ can delete images
drop policy if exists "Managers delete images" on storage.objects;
create policy "Managers delete images"
  on storage.objects for delete
  to authenticated
  using (public.has_any_role(array['owner','manager']));

-- ============================================
-- STORAGE BUCKET SIZE QUOTA (optional: 5GB each)
-- ============================================
update storage.buckets set file_size_limit = 5242880 where id in ('products','categories','offers','branches');
