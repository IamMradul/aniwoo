# Production Deployment Setup

Follow these steps to set up your Aniwoo platform in production:

## 1. Database Tables Setup

Your production Supabase database needs the following tables. Run the SQL script in your Supabase SQL Editor:

**Steps:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your production project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `supabase/setup_tables.sql`
6. Click **Run**

This creates:
- `vets` - Store veterinarian clinic information
- `bookings` - Store appointment bookings
- `pets` - Store pet information for owners
- `health_scans` - Store health scan records
- All necessary indexes and RLS policies

## 2. Admin Portal Setup

After database setup, also run the admin setup:

1. In Supabase SQL Editor, run: `supabase/setup_admin_portal.sql`

This creates:
- `shop_products` - Product catalog for the pet shop

## 3. Add Test Data (Optional)

To verify vets are showing in production:

```sql
-- Add a test vet (replace with real data)
INSERT INTO public.vets (
  user_id, 
  clinic_name, 
  specialization, 
  location, 
  city, 
  state, 
  phone, 
  experience_years, 
  qualifications, 
  consultation_fee
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test Veterinary Clinic',
  'General Practice, Surgery',
  '123 Pet Street',
  'New Delhi',
  'Delhi',
  '+91-1234567890',
  5,
  'BVSC, MVSc',
  500
);
```

## 4. Environment Variables

Ensure your production environment has:

```
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
ANIWOO_SESSION_SECRET=your_secure_random_secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
```

## 5. Troubleshooting

### "No data showing" on vets page
- Ensure the SQL script (`setup_tables.sql`) was run in production
- Check Supabase logs for query errors
- Verify there are vets in the database: `SELECT COUNT(*) FROM public.vets;`

### RLS Policy Issues
- Check if RLS is properly enabled on the tables
- Verify the `vets_select_policy` that allows public reads exists
- Run: `SELECT * FROM pg_policies WHERE tablename = 'vets';`

### Service Key Not Found
- Regenerate the service key in Supabase Settings > API
- Update `SUPABASE_SERVICE_ROLE_KEY` environment variable

## 6. Verify Setup

To verify everything is working:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check vets count
SELECT COUNT(*) FROM public.vets;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'vets';
```

## 7. Deployment

After tables are created and data is added:

1. Deploy your code to production
2. The vets page at `/vets` will now fetch data from the API endpoint
3. Load the vets page and verify data displays correctly

---

**Need help?** Check Supabase logs and browser console for error messages.
