# Next.js Migration Guide

## Migration Status
The project has been partially migrated to Next.js. Here's what's been done and what needs to be completed.

## Completed
✅ Updated `package.json` with Next.js dependencies
✅ Created `next.config.js`
✅ Updated `tsconfig.json` for Next.js
✅ Updated `tailwind.config.cjs` for Next.js
✅ Created `app/globals.css` (global styles)
✅ Created `app/layout.tsx` (root layout)
✅ Created `lib/supabaseClient.ts` (updated for Next.js env vars)
✅ Created `components/layout/Header.tsx` (migrated to Next.js Link)
✅ Created `components/layout/Footer.tsx` (migrated to Next.js Link)
✅ Created `components/layout/Layout.tsx` (client component)

## TODO - Next Steps

### 1. Create AuthProvider
Create `components/providers/AuthProvider.tsx`:
- Copy content from `src/context/AuthContext.tsx`
- Add `'use client'` at the top
- Update imports: `import { supabase } from '@/lib/supabaseClient'`
- Update imports: `import { decodeGoogleToken } from '@/lib/googleAuth'`

### 2. Copy Remaining Components
Copy all components from `src/components/` to `components/`:
- `components/common/FootprintTrail.tsx`
- `components/common/FadeInSection.tsx`
- `components/common/ErrorBoundary.tsx`
- `components/auth/GoogleSignIn.tsx`
- Any other components in `src/components/`

### 3. Create Pages
Create pages in `app/` directory:
- `app/page.tsx` - Home page (copy from `src/pages/Home.tsx`, add `'use client'`)
- `app/shop/page.tsx` - Shop page
- `app/vets/page.tsx` - Vets page
- `app/ai-health-check/page.tsx` - AI Health Check
- `app/contact/page.tsx` - Contact
- `app/about/page.tsx` - About
- `app/login/page.tsx` - Login
- `app/signup/page.tsx` - Signup
- `app/profile/page.tsx` - Profile
- `app/vet-dashboard/page.tsx` - Vet Dashboard

### 4. Update Environment Variables
Create `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 5. Install Dependencies
Run:
```bash
npm install
```

### 6. Update Imports in All Files
- Replace `react-router-dom` imports with `next/link` and `next/navigation`
- Replace `useLocation()` with `usePathname()` from `next/navigation`
- Replace `NavLink` with `Link` from `next/link`
- Add `'use client'` to all components that use hooks or browser APIs

### 7. Test and Run
```bash
npm run dev
```

## Key Differences from Vite
1. **Routing**: Use Next.js file-based routing instead of React Router
2. **Client Components**: Add `'use client'` to components using hooks
3. **Environment Variables**: Use `NEXT_PUBLIC_` prefix for client-side vars
4. **Imports**: Use `@/` alias for imports (configured in tsconfig.json)
5. **Fonts**: Use `next/font/google` for Google Fonts

## Notes
- Keep the old `src/` directory until migration is complete
- Test each page after migration
- Update any hardcoded paths or route references
