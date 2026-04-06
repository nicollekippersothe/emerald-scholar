-- ScholarIA — Supabase schema
-- Execute no SQL Editor do seu projeto Supabase

-- 1. Tabela de perfis (extende auth.users)
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  plan              text not null default 'free' check (plan in ('free', 'estudante', 'pesquisador')),
  searches_today    integer not null default 0,
  searches_reset_at timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

-- 2. Row Level Security
alter table public.profiles enable row level security;

-- Usuário só lê/atualiza o próprio perfil
create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Service role pode inserir (criação de perfil no primeiro login)
create policy "profiles: service insert" on public.profiles
  for insert with check (true);

-- 3. Trigger: cria perfil automaticamente após signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
