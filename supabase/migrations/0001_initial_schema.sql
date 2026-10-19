-- Extensions
create extension if not exists "pgcrypto";

-- ─── Enums ──────────────────────────────────────────────────

create type public.plan_type as enum ('free', 'pro');

-- ─── profiles ───────────────────────────────────────────────
-- One row per auth user; created automatically by trigger on signup.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  plan public.plan_type not null default 'free',
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

-- Auto-create a profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── stores ─────────────────────────────────────────────────

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  shopify_domain text not null,
  shop_name text,
  -- Access token is encrypted with pgcrypto before storage.
  access_token text,
  plan_limit_reached boolean not null default false,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, shopify_domain)
);

-- ─── apps ───────────────────────────────────────────────────

create table public.apps (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  shopify_app_id text not null,
  title text not null,
  handle text not null default '',
  installed_at timestamptz,
  category text,
  monthly_cost numeric(10,2),
  is_redundant boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique (store_id, shopify_app_id)
);

-- ─── audits ─────────────────────────────────────────────────

create table public.audits (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  total_monthly_cost numeric(10,2) not null default 0,
  potential_savings numeric(10,2) not null default 0,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index audits_store_id_idx on public.audits (store_id);
create index stores_user_id_idx on public.stores (user_id);
create index apps_store_id_idx on public.apps (store_id);

-- ─── Row Level Security ─────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.apps enable row level security;
alter table public.audits enable row level security;

-- profiles: users can read/update only their own row
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- stores: users can CRUD only their own stores
create policy "Users can view own stores"
  on public.stores for select
  using (auth.uid() = user_id);

create policy "Users can insert own stores"
  on public.stores for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stores"
  on public.stores for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own stores"
  on public.stores for delete
  using (auth.uid() = user_id);

-- apps: scoped through parent store ownership
create policy "Users can view apps of own stores"
  on public.apps for select
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_id and s.user_id = auth.uid()
    )
  );

create policy "Users can insert apps for own stores"
  on public.apps for insert
  with check (
    exists (
      select 1 from public.stores s
      where s.id = store_id and s.user_id = auth.uid()
    )
  );

create policy "Users can update apps of own stores"
  on public.apps for update
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_id and s.user_id = auth.uid()
    )
  );

create policy "Users can delete apps of own stores"
  on public.apps for delete
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_id and s.user_id = auth.uid()
    )
  );

-- audits: scoped through parent store ownership
create policy "Users can view audits of own stores"
  on public.audits for select
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_id and s.user_id = auth.uid()
    )
  );

create policy "Users can insert audits for own stores"
  on public.audits for insert
  with check (
    exists (
      select 1 from public.stores s
      where s.id = store_id and s.user_id = auth.uid()
    )
  );

create policy "Users can delete audits of own stores"
  on public.audits for delete
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_id and s.user_id = auth.uid()
    )
  );

-- ─── Helper: count audits this month (used for free-plan limit) ──

create or replace function public.audit_count_this_month(p_user_id uuid)
returns integer
language sql
stable
security definer set search_path = public
as $$
  select count(*)::integer
  from public.audits a
  join public.stores s on s.id = a.store_id
  where s.user_id = p_user_id
    and a.created_at >= date_trunc('month', now());
$$;
