-- Выполните этот скрипт в Supabase → SQL Editor (один раз)
-- Создаёт таблицу статей и хранилище для обложек

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
