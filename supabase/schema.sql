-- ============================================================================
--  LUND HUMAN RIGHTS LAW REVIEW — Esquema de base de datos (Supabase)
-- ============================================================================
--  ORDEN DE EJECUCIÓN (importante):
--    Las funciones SQL se validan al crearse, por lo que NO pueden referenciar
--    tablas que aún no existen. Por eso este archivo va en este orden:
--      1) extensiones
--      2) tablas
--      3) funciones helper (ya pueden leer profiles)
--      4) triggers
--      5) índices
--      6) vista pública + RPC
--      7) RLS y políticas
--      8) permisos
--
--  Cómo usarlo:
--    Supabase → SQL Editor → New query → pega TODO este archivo → Run.
--    Es idempotente y transaccional: si algo falla, no deja nada a medias.
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

begin;

set local search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- 1. TABLAS
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Perfil público + rol. Se crea automáticamente al registrarse con Google.';

create table if not exists public.articles (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references public.profiles (id) on delete cascade,
  title          text not null,
  category       text not null,
  abstract       text,
  pdf_path       text not null unique,
  pdf_size_bytes bigint,
  show_email     boolean not null default false,
  like_count     integer not null default 0,
  report_count   integer not null default 0,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint articles_title_len    check (char_length(btrim(title)) between 5 and 200),
  constraint articles_abstract_len check (abstract is null or char_length(abstract) <= 3000),
  constraint articles_counters     check (like_count >= 0 and report_count >= 0),
  constraint articles_category_valid check (category in (
    'international-law',
    'international-human-rights-law',
    'humanitarian-law',
    'human-rights-and-remedies',
    'human-rights-and-cultural-diversity',
    'democratic-policing-and-human-rights',
    'human-rights-law-environment-and-climate-change',
    'business-and-human-rights',
    'migration-law',
    'european-fundamental-rights-law',
    'international-criminal-law',
    'contemporary-human-rights-issues',
    'human-rights-in-practice'
  ))
);

comment on table public.articles is 'Artículos (PDF) publicados por estudiantes del máster.';

create table if not exists public.article_likes (
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

create table if not exists public.article_reports (
  id             uuid primary key default gen_random_uuid(),
  article_id     uuid not null references public.articles (id) on delete cascade,
  reporter_id    uuid references public.profiles (id) on delete set null,
  reporter_email text,
  reason         text not null,
  details        text,
  status         text not null default 'open',
  created_at     timestamptz not null default now(),

  constraint reports_reason_valid check (reason in ('plagiarism', 'incorrect_references', 'illegal_content')),
  constraint reports_status_valid check (status in ('open', 'reviewed', 'dismissed')),
  constraint reports_details_len  check (details is null or char_length(details) <= 1000),
  constraint reports_email_len    check (reporter_email is null or char_length(reporter_email) <= 254)
);

comment on table public.article_reports is 'Reportes de visitantes. Solo el administrador puede leerlos.';

-- ----------------------------------------------------------------------------
-- 2. FUNCIONES HELPER (ya existen las tablas que necesitan)
-- ----------------------------------------------------------------------------

-- Devuelve true si el email pertenece al dominio de estudiantes de Lund.
create or replace function public.is_allowed_email(candidate text)
returns boolean
language sql
immutable
as $$
  select candidate is not null
         and lower(candidate) ~ '^[a-z0-9._%+\-]+@student\.lu\.se$';
$$;

-- ¿El usuario que hace la petición es administrador?
-- SECURITY DEFINER para leer profiles sin depender de sus propias policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Actualiza updated_at automáticamente.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. PERFIL AUTOMÁTICO AL REGISTRARSE (con bloqueo de dominio)
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Defensa en profundidad: aunque alguien fuerce el OAuth, sin @student.lu.se no hay cuenta.
  if not public.is_allowed_email(new.email) then
    raise exception 'Only @student.lu.se accounts can access the Lund Human Rights Law Review.'
      using errcode = '42501';
  end if;

  insert into public.profiles as p (id, email, full_name, avatar_url)
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update
    set email      = excluded.email,
        full_name  = coalesce(excluded.full_name, p.full_name),
        avatar_url = coalesce(excluded.avatar_url, p.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. CONTADORES (likes / reportes) Y updated_at
-- ----------------------------------------------------------------------------

create or replace function public.sync_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.articles set like_count = like_count + 1 where id = new.article_id;
  elsif tg_op = 'DELETE' then
    update public.articles set like_count = greatest(like_count - 1, 0) where id = old.article_id;
  end if;
  return null;
end;
$$;

drop trigger if exists article_likes_sync_count on public.article_likes;
create trigger article_likes_sync_count
  after insert or delete on public.article_likes
  for each row execute function public.sync_like_count();

create or replace function public.sync_report_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.articles set report_count = report_count + 1 where id = new.article_id;
  elsif tg_op = 'DELETE' then
    update public.articles set report_count = greatest(report_count - 1, 0) where id = old.article_id;
  end if;
  return null;
end;
$$;

drop trigger if exists article_reports_sync_count on public.article_reports;
create trigger article_reports_sync_count
  after insert or delete on public.article_reports
  for each row execute function public.sync_report_count();

drop trigger if exists articles_touch_updated_at on public.articles;
create trigger articles_touch_updated_at
  before update on public.articles
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 5. ÍNDICES
-- ----------------------------------------------------------------------------

create index if not exists articles_created_at_idx on public.articles (created_at desc);
create index if not exists articles_category_idx   on public.articles (category);
create index if not exists articles_author_idx     on public.articles (author_id);
create index if not exists articles_like_count_idx on public.articles (like_count desc);
create index if not exists articles_title_trgm_idx on public.articles using gin (title gin_trgm_ops);
create index if not exists articles_abstract_trgm_idx on public.articles using gin (abstract gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- 6. VISTA PÚBLICA (la única superficie de lectura del catálogo)
-- ----------------------------------------------------------------------------
-- Es SECURITY DEFINER a propósito: permite leer el nombre del autor y, SOLO si
-- el autor activó "mostrar correo", su email. El resto de columnas sensibles
-- de profiles (email real, is_admin) nunca se expone.

-- La función depende de la vista, así que hay que quitarla antes de recrearla
-- (si no, en una segunda ejecución "drop view" fallaría por dependencias).
drop function if exists public.random_public_articles(integer);
drop view if exists public.articles_public;

create view public.articles_public
with (security_invoker = false) as
select
  a.id,
  a.title,
  a.category,
  a.abstract,
  a.pdf_path,
  a.pdf_size_bytes,
  a.like_count,
  a.report_count,
  a.created_at,
  a.author_id,
  p.full_name   as author_name,
  p.avatar_url  as author_avatar_url,
  case when a.show_email then p.email else null end as author_email
from public.articles a
join public.profiles p on p.id = a.author_id
where a.is_published = true;

comment on view public.articles_public is 'Catálogo público. El email del autor solo aparece si show_email = true.';

revoke all on public.articles_public from anon, authenticated;
grant select on public.articles_public to anon, authenticated;

-- Artículos aleatorios para la portada ("Destacados").
create or replace function public.random_public_articles(p_limit integer default 3)
returns setof public.articles_public
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from public.articles_public
  order by random()
  limit greatest(least(p_limit, 24), 0);
$$;

grant execute on function public.random_public_articles(integer) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.articles        enable row level security;
alter table public.article_likes   enable row level security;
alter table public.article_reports enable row level security;

-- --- profiles ---------------------------------------------------------------
-- Cada usuario ve su propia fila; el admin ve todas.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- Nadie actualiza perfiles desde el cliente (el admin se cambia por SQL).
-- Así es imposible auto-promoverse a is_admin.
drop policy if exists "profiles_update_own" on public.profiles;

-- --- articles ---------------------------------------------------------------
drop policy if exists "articles_select_visible" on public.articles;
create policy "articles_select_visible"
  on public.articles for select
  to authenticated
  using (author_id = auth.uid() or is_published = true or public.is_admin());

drop policy if exists "articles_insert_own" on public.articles;
create policy "articles_insert_own"
  on public.articles for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and is_published = true
    -- Solo perfiles ya verificados (creados por el trigger de dominio) publican.
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "articles_delete_own_or_admin" on public.articles;
create policy "articles_delete_own_or_admin"
  on public.articles for delete
  to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- --- article_likes ----------------------------------------------------------
drop policy if exists "likes_select_own" on public.article_likes;
create policy "likes_select_own"
  on public.article_likes for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "likes_insert_own" on public.article_likes;
create policy "likes_insert_own"
  on public.article_likes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.articles a where a.id = article_id and a.is_published)
  );

drop policy if exists "likes_delete_own" on public.article_likes;
create policy "likes_delete_own"
  on public.article_likes for delete
  to authenticated
  using (user_id = auth.uid());

-- --- article_reports --------------------------------------------------------
-- Los reportes se insertan SOLO desde el servidor con la service_role key
-- (así el visitante anónimo nunca habla directamente con la tabla).
drop policy if exists "reports_select_admin" on public.article_reports;
create policy "reports_select_admin"
  on public.article_reports for select
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. PERMISOS A NIVEL DE TABLA/COLUMNA
-- ----------------------------------------------------------------------------
-- Sin esto, el cliente podría escribir like_count = 999999 o is_admin = true.

revoke all on public.profiles        from anon, authenticated;
revoke all on public.articles        from anon, authenticated;
revoke all on public.article_likes   from anon, authenticated;
revoke all on public.article_reports from anon, authenticated;

-- Los perfiles son de solo lectura desde el cliente: el nombre y el avatar
-- llegan del OAuth de Google, y el rol solo se cambia con SQL (ver README).
grant select on public.profiles to authenticated;

grant select on public.articles to authenticated;
grant insert (author_id, title, category, abstract, pdf_path, pdf_size_bytes, show_email)
  on public.articles to authenticated;
grant delete on public.articles to authenticated;

grant select, insert, delete on public.article_likes to authenticated;

grant select on public.article_reports to authenticated;

grant usage on schema public to anon, authenticated;

commit;

-- Refresca la caché de PostgREST para que las nuevas tablas/vista estén disponibles.
notify pgrst, 'reload schema';