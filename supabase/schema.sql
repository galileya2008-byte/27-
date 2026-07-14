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

-- Подкасты для блога
create table if not exists public.podcasts (
  slug text primary key,
  title text not null,
  description text not null default '',
  article text not null default '',
  audio_url text not null default '',
  duration text not null default '',
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.podcasts enable row level security;

drop policy if exists "public_read_podcasts" on public.podcasts;
drop policy if exists "auth_insert_podcasts" on public.podcasts;
drop policy if exists "auth_update_podcasts" on public.podcasts;
drop policy if exists "auth_delete_podcasts" on public.podcasts;

create policy "public_read_podcasts"
on public.podcasts
for select
using (true);

create policy "auth_insert_podcasts"
on public.podcasts
for insert
to authenticated
with check (true);

create policy "auth_update_podcasts"
on public.podcasts
for update
to authenticated
using (true);

create policy "auth_delete_podcasts"
on public.podcasts
for delete
to authenticated
using (true);

-- Хранилище аудио (выполните в SQL Editor после создания bucket в Storage или через команду ниже)
insert into storage.buckets (id, name, public)
values ('podcast-audio', 'podcast-audio', true)
on conflict (id) do nothing;

drop policy if exists "public_read_podcast_audio" on storage.objects;
drop policy if exists "auth_upload_podcast_audio" on storage.objects;
drop policy if exists "auth_delete_podcast_audio" on storage.objects;

create policy "public_read_podcast_audio"
on storage.objects
for select
using (bucket_id = 'podcast-audio');

create policy "auth_upload_podcast_audio"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'podcast-audio');

create policy "auth_delete_podcast_audio"
on storage.objects
for delete
to authenticated
using (bucket_id = 'podcast-audio');

-- Статьи для базы знаний
create table if not exists public.articles (
  slug text primary key,
  title text not null,
  description text not null default '',
  content text not null default '',
  image_url text not null default '',
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.articles enable row level security;

drop policy if exists "public_read_articles" on public.articles;
drop policy if exists "auth_insert_articles" on public.articles;
drop policy if exists "auth_update_articles" on public.articles;
drop policy if exists "auth_delete_articles" on public.articles;

create policy "public_read_articles"
on public.articles
for select
using (true);

create policy "auth_insert_articles"
on public.articles
for insert
to authenticated
with check (true);

create policy "auth_update_articles"
on public.articles
for update
to authenticated
using (true);

create policy "auth_delete_articles"
on public.articles
for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do nothing;

drop policy if exists "public_read_article_images" on storage.objects;
drop policy if exists "auth_upload_article_images" on storage.objects;
drop policy if exists "auth_delete_article_images" on storage.objects;

create policy "public_read_article_images"
on storage.objects
for select
using (bucket_id = 'article-images');

create policy "auth_upload_article_images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'article-images');

create policy "auth_delete_article_images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'article-images');
