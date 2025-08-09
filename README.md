# AZ-204 Study Tracker

Minimal scaffold for a Next.js 14 + Supabase + Tailwind app.

## Prerequisites
- Node 18+
- Supabase project (URL + anon key)

## Setup
1. Copy env:
```bash
cp .env.example .env.local
```
2. Fill values for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
3. Install and run:
```bash
npm install
npm run dev
```

## Database
- Apply `supabase/migrations/0001_init.sql` to your Supabase project.
- Create a Storage bucket named `uploads`.

## Notes
- This is a minimal shell with Home and basic layout. Add routes for /signin, /dashboard, /modules, etc.
