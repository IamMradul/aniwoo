# Admin Portal Setup (Supabase)

The Aniwoo admin portal expects:
- `public.shop_products` table for product management
- at least one user with `profiles.role = 'admin'`

## 1) Create the products table

1. Open Supabase Dashboard -> SQL Editor.
2. Copy and run: `supabase/setup_admin_portal.sql`

This creates:
- `public.shop_products`
- trigger to auto-update `updated_at`
- useful indexes
- optional seed products

## 2) Set a user as admin

In Supabase SQL Editor, run one of these:

If you get `profiles_role_check` constraint error, run this once first:

```sql
alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('vet', 'pet_owner', 'admin') or role is null);
```

If you still see `constraint ... already exists`, run the `drop constraint if exists ...` line separately first, then run the `add constraint ...` line.

```sql
update public.profiles
set role = 'admin', updated_at = now()
where lower(email) = lower('your-admin-email@example.com');
```

or

```sql
update public.profiles
set role = 'admin', updated_at = now()
where id = 'YOUR_AUTH_USER_ID';
```

Then verify:

```sql
select id, name, email, role
from public.profiles
where role = 'admin';
```

## 3) Refresh login

After promoting a user to admin:
- log out and log in again (or clear/restart session)
- open `/admin`

If you still get access denied, check the user's `profiles.role` and confirm the app is using the same Supabase project.
