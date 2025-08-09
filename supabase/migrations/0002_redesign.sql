-- Redesign migration: additive, non-breaking
-- Goals:
-- - Replace quoted "order" usage with sort_order (keep old column for now)
-- - Allow resources to be scoped to sections (optional)
-- - Add timestamps and update triggers for ratings/progress
-- - Add data integrity checks for progress.current_section_id belonging to module
-- - Add helpful public views for static curriculum pages
-- - Add indexes to support common queries

-- 1) sort_order columns (keep existing "order" for backward-compat)
alter table if exists public.modules
  add column if not exists sort_order int;
update public.modules set sort_order = coalesce(sort_order, "order");
alter table if exists public.modules
  alter column sort_order set not null;
create index if not exists idx_modules_sort_order on public.modules(sort_order);

alter table if exists public.module_sections
  add column if not exists sort_order int;
update public.module_sections set sort_order = coalesce(sort_order, "order");
alter table if exists public.module_sections
  alter column sort_order set not null;
create index if not exists idx_module_sections_sort_order on public.module_sections(module_id, sort_order);

-- 2) Resources can optionally link to a section
alter table if exists public.resources
  add column if not exists section_id uuid references public.module_sections(id) on delete cascade;
create index if not exists idx_resources_section on public.resources(section_id);

-- 3) Add timestamps and update triggers where useful
alter table if exists public.ratings
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.progress
  add column if not exists updated_at timestamptz default now();

-- Ensure the generic set_updated_at() exists (from 0001)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Attach/update triggers
create or replace trigger trg_ratings_updated_at
before update on public.ratings
for each row execute function public.set_updated_at();

create or replace trigger trg_progress_updated_at
before update on public.progress
for each row execute function public.set_updated_at();

-- 4) Integrity: current_section_id must belong to the same module
create or replace function public.ensure_progress_section_in_module()
returns trigger language plpgsql as $$
declare sec_module uuid;
begin
  if new.current_section_id is null then
    return new;
  end if;
  select ms.module_id into sec_module from public.module_sections ms where ms.id = new.current_section_id;
  if sec_module is null then
    raise exception 'current_section_id % does not exist', new.current_section_id;
  end if;
  if sec_module <> new.module_id then
    raise exception 'current_section_id % not in module %', new.current_section_id, new.module_id;
  end if;
  return new;
end $$;

-- Create trigger (safe recreate)
drop trigger if exists trg_progress_section_guard on public.progress;
create trigger trg_progress_section_guard
before insert or update of module_id, current_section_id on public.progress
for each row execute function public.ensure_progress_section_in_module();

-- 5) Views for public curriculum
create or replace view public.v_modules_overview as
select m.id,
       m.title,
       coalesce(m.sort_order, m."order") as sort_order,
       m.description,
       (select count(*) from public.module_sections s where s.module_id = m.id) as sections_count,
       (select count(*) from public.resources r where r.module_id = m.id) as resources_count
from public.modules m
order by sort_order asc, m.title asc;

create or replace view public.v_sections_overview as
select s.id,
       s.module_id,
       s.title,
       coalesce(s.sort_order, s."order") as sort_order,
       (select count(*) from public.resources r where r.section_id = s.id) as resources_count
from public.module_sections s
order by s.module_id, sort_order asc, s.title asc;

-- 6) Helpful indexes for common queries
create index if not exists idx_notes_section on public.notes(section_id);
create index if not exists idx_ratings_section on public.ratings(section_id);

-- 7) RLS remains the same as 0001; views rely on base-table policies (modules/sections/resources are public read)
-- No policy changes required here.
