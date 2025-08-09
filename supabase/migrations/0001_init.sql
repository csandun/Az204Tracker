-- Schema per prompt + indexes + triggers + RLS + storage policies scaffold
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

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

do $$
begin
  if not exists (select 1 from pg_type where typname = 'progress_status') then
    create type progress_status as enum ('not_started','in_progress','done','skipped');
  end if;
end $$;

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  current_section_id uuid references public.module_sections(id),
  status progress_status default 'not_started',
  last_visit timestamptz default now(),
  unique (user_id, module_id)
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

-- Indexes
create index if not exists idx_module_sections_module_order on public.module_sections(module_id, "order");
create index if not exists idx_resources_module on public.resources(module_id);
create index if not exists idx_notes_user_section on public.notes(user_id, section_id);
create index if not exists idx_ratings_user_section on public.ratings(user_id, section_id);
create index if not exists idx_progress_user_module on public.progress(user_id, module_id);
create index if not exists idx_uploads_user_created on public.uploads(user_id, created_at desc);

-- Trigger for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_notes_updated_at on public.notes;
create trigger trg_notes_updated_at before update on public.notes
for each row execute function public.set_updated_at();

-- RLS
alter table public.modules enable row level security;
alter table public.module_sections enable row level security;
alter table public.resources enable row level security;
alter table public.notes enable row level security;
alter table public.note_assets enable row level security;
alter table public.ratings enable row level security;
alter table public.progress enable row level security;
alter table public.uploads enable row level security;

-- Public read on curriculum
drop policy if exists "read modules" on public.modules;
create policy "read modules" on public.modules for select using (true);
drop policy if exists "read sections" on public.module_sections;
create policy "read sections" on public.module_sections for select using (true);
drop policy if exists "read resources" on public.resources;
create policy "read resources" on public.resources for select using (true);

-- Notes
drop policy if exists "select own notes" on public.notes;
create policy "select own notes" on public.notes for select using (auth.uid() = user_id);
drop policy if exists "insert own notes" on public.notes;
create policy "insert own notes" on public.notes for insert with check (auth.uid() = user_id);
drop policy if exists "update own notes" on public.notes;
create policy "update own notes" on public.notes for update using (auth.uid() = user_id);
drop policy if exists "delete own notes" on public.notes;
create policy "delete own notes" on public.notes for delete using (auth.uid() = user_id);

-- Note assets via note ownership
drop policy if exists "select note assets via note" on public.note_assets;
create policy "select note assets via note" on public.note_assets for select using (exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid()));
drop policy if exists "insert note assets via note" on public.note_assets;
create policy "insert note assets via note" on public.note_assets for insert with check (exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid()));
drop policy if exists "delete note assets via note" on public.note_assets;
create policy "delete note assets via note" on public.note_assets for delete using (exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid()));

-- Ratings
drop policy if exists "select own ratings" on public.ratings;
create policy "select own ratings" on public.ratings for select using (auth.uid() = user_id);
drop policy if exists "upsert own ratings" on public.ratings;
create policy "upsert own ratings" on public.ratings for insert with check (auth.uid() = user_id);
drop policy if exists "update own ratings" on public.ratings;
create policy "update own ratings" on public.ratings for update using (auth.uid() = user_id);
drop policy if exists "delete own ratings" on public.ratings;
create policy "delete own ratings" on public.ratings for delete using (auth.uid() = user_id);

-- Progress
drop policy if exists "select own progress" on public.progress;
create policy "select own progress" on public.progress for select using (auth.uid() = user_id);
drop policy if exists "upsert own progress" on public.progress;
create policy "upsert own progress" on public.progress for insert with check (auth.uid() = user_id);
drop policy if exists "update own progress" on public.progress;
create policy "update own progress" on public.progress for update using (auth.uid() = user_id);
drop policy if exists "delete own progress" on public.progress;
create policy "delete own progress" on public.progress for delete using (auth.uid() = user_id);

-- Uploads
drop policy if exists "select own uploads" on public.uploads;
create policy "select own uploads" on public.uploads for select using (auth.uid() = user_id);
drop policy if exists "insert own uploads" on public.uploads;
create policy "insert own uploads" on public.uploads for insert with check (auth.uid() = user_id);
drop policy if exists "delete own uploads" on public.uploads;
create policy "delete own uploads" on public.uploads for delete using (auth.uid() = user_id);

-- Storage policies (bucket 'uploads') — may require table ownership; skip gracefully if not owner
do $$
begin
  -- Try enabling RLS (usually already enabled by Supabase)
  begin
    execute 'alter table storage.objects enable row level security';
  exception when others then
    raise notice 'Skipping RLS enable on storage.objects (not owner or already enabled).';
  end;

  -- Try to (re)create policies
  begin
    execute $$drop policy if exists "read own objects" on storage.objects$$;
    execute $$create policy "read own objects" on storage.objects
      for select using (
        bucket_id = 'uploads' and (auth.uid()::text = (storage.foldername(name))[1])
      )$$;

    execute $$drop policy if exists "insert own objects" on storage.objects$$;
    execute $$create policy "insert own objects" on storage.objects
      for insert with check (
        bucket_id = 'uploads' and (auth.uid()::text = (storage.foldername(name))[1])
      )$$;

    execute $$drop policy if exists "delete own objects" on storage.objects$$;
    execute $$create policy "delete own objects" on storage.objects
      for delete using (
        bucket_id = 'uploads' and (auth.uid()::text = (storage.foldername(name))[1])
      )$$;
  exception when others then
    raise notice 'Skipping storage.objects policies (not owner).';
  end;
end $$;
