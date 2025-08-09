---
mod- Features:
  - **Dashboard**: comprehensive overview with progress statistics, current/next module cards, recent activity, and quick navigation with module status indicators.
  - **Modules list** with highlightable cards and **Module detail** pages showing sections + resources + per-section progress status.
  - **Section Pages**: comprehensive section view with progress controls, star ratings, short notes with threading, and resources management.
  - **Short Notes**: lightweight markdown notes with threading support, edit functionality, timestamps, and expandable modal interface.
  - **Ratings**: 1–5 stars per section; user-owned unique per section with interactive star selection.
  - **Progress Tracking**: module and section-level progress with status indicators (not_started, in_progress, done, skipped).
  - **Resources Management**: add/delete resources per module with type categorization (video, doc, link, repo).
  - **Clean UI**: light theme with white backgrounds, subtle borders, highlighting effects, and consistent typography.
  - **Auth**: email/password authentication with protected routes (Supabase Auth).t
---
You are GitHub Copilot helping build **AZ-204 Study Tracker** — a free, static-first web app for personal study tracking.

## GOALS
- Build a **Next.js (App Router) + TypeScript + Tailwind**  with apple design conditions app.
- Use **Supabase** for Auth, Postgres, Storage, **with RLS enabled**.
- Features:
  - **Dashboard**: overall progress %, current/next module, today’s plan, missed/overdue flags, quick navigation.
  - **Modules list** and **Module detail** pages (sections + resources + per-section status).
  - **Section Notes**: rich text + image uploads; user-owned.
  - **Ratings**: 1–5 stars per section; user-owned unique per section.
  - **Uploads**: screenshots stored in Supabase Storage and linked to module/section.
  - **Auth**: email/password (Supabase Auth).
- **No quizzes** (not in scope).

## TECH DECISIONS
- Framework: **Next.js 14+ App Router**, **TypeScript**.
- Styling: **Tailwind CSS** with clean light theme (white backgrounds, subtle borders, hover effects).
- DB/Storage: **Supabase** (`@supabase/supabase-js`) with Row Level Security (RLS).
- Components: Server/Client component separation, **react-markdown** with **remark-gfm** for markdown support.
- Auth: Supabase Auth with protected routes via middleware.
- Database: PostgreSQL with custom types, unique constraints, and proper upsert operations.
- Hosting: **Vercel free tier**.
- Repo contains this prompt file to guide consistent generation.

## IMPLEMENTATION STATUS
- **Core Pages**: Enhanced dashboard with comprehensive progress tracking, modules list, module details, section details with breadcrumb navigation.
- **Dashboard Features**: Progress statistics cards, current/next module suggestions, recent activity timeline, quick navigation with status indicators.
- **Components**: 
  - `Breadcrumbs.tsx`: Navigation trail for better UX
  - `ShortNotes.tsx`: Markdown notes with threading, edit functionality, timestamps
  - `ProgressControls.tsx`: Section progress management with enhanced error handling
  - `StarRating.tsx`: Interactive 1-5 star rating system
  - `ResourcesPanel.tsx`: Add/delete resources with type categorization
- **Theme**: Clean white theme with consistent typography, hover effects, and highlighting.
- **Authentication**: Protected routes with improved middleware for dashboard access.
- **Database**: RLS policies implemented, unique constraints for progress tracking, numbered migration strategy.

---

## DATA MODEL (Postgres)
Create these tables in **public schema**. Copilot: generate SQL migration compatible with Supabase. use can use #supabase mcp

```sql
-- CURRICULUM (public read)
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  "order" int not null,
  description text
);

create table if not exists public.module_sections (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  "order" int not null
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  url text not null,
  "type" text check ("type" in ('video','doc','link','repo')) default 'link'
);

-- USER-OWNED
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section_id uuid not null references public.module_sections(id) on delete cascade,
  title text,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.note_assets (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  file_url text not null,
  caption text
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section_id uuid not null references public.module_sections(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  unique (user_id, section_id)
);

create type if not exists progress_status as enum ('not_started','in_progress','done','skipped');

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  current_section_id uuid references public.module_sections(id),
  status progress_status default 'not_started',
  last_visit timestamptz default now(),
  unique (user_id, module_id)
);

-- Short notes table for lightweight markdown notes
create table if not exists public.short_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section_id uuid not null references public.module_sections(id) on delete cascade,
  content text not null,
  parent_note_id uuid references public.short_notes(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  section_id uuid references public.module_sections(id) on delete set null,
  file_url text not null,
  kind text check (kind in ('screenshot','note-asset')) default 'screenshot',
  created_at timestamptz default now()
);