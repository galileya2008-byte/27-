create table if not exists public.visits (
  id bigint generated always as identity primary key,
  visited_at timestamptz not null default now(),
  page_path text not null,
  referrer text,
  user_agent text,
  language text,
  viewport text,
  timezone text
);

alter table public.visits enable row level security;

drop policy if exists "anon_insert_visits" on public.visits;
drop policy if exists "auth_read_visits" on public.visits;

create policy "anon_insert_visits"
on public.visits
for insert
to anon
with check (true);

create policy "auth_read_visits"
on public.visits
for select
to authenticated
using (true);
