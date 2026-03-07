-- Aniwoo admin portal setup script
-- Run this in Supabase SQL Editor.

-- 1) Ensure UUID helper exists for default IDs
create extension if not exists pgcrypto;

-- 2) Create products table used by /api/admin/products and /api/products
create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  category text,
  image_url text,
  in_stock boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Keep updated_at fresh on updates
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_shop_products_updated_at on public.shop_products;
create trigger trg_shop_products_updated_at
before update on public.shop_products
for each row
execute function public.set_updated_at_timestamp();

-- 4) Helpful indexes
create index if not exists idx_shop_products_active_created
  on public.shop_products (is_active, created_at desc);
create index if not exists idx_shop_products_category
  on public.shop_products (category);

-- 5) Optional seed data (safe to rerun)
insert into public.shop_products (name, description, price, category, in_stock, is_active)
values
  ('Premium Puppy Kibble', 'High-protein dry food for growing puppies.', 899.00, 'Food', true, true),
  ('Herbal Pet Shampoo', 'Gentle shampoo for sensitive skin and coat care.', 349.00, 'Grooming', true, true),
  ('Dental Chew Sticks', 'Daily dental support chews for dogs.', 299.00, 'Health', true, true)
on conflict do nothing;

-- 6) (Optional) Enable RLS now or later depending on your policy strategy.
-- alter table public.shop_products enable row level security;

-- 7) Promote users to admin in profiles table
-- Replace with your real email/id values. Run one of these statements.

-- If your project still has the old role constraint, extend it first.
alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('vet', 'pet_owner', 'admin') or role is null);

-- By email:
-- update public.profiles
-- set role = 'admin', updated_at = now()
-- where lower(email) = lower('your-admin-email@example.com');

-- By user id:
-- update public.profiles
-- set role = 'admin', updated_at = now()
-- where id = '00000000-0000-0000-0000-000000000000';

-- 8) Verify admin users:
-- select id, name, email, role from public.profiles where role = 'admin';
