-- =============================================================================
-- Buff Buddy — initial schema (Phase 2)
--
-- Proposes the full data model from spec §10 with Row Level Security so every
-- user can only read/write their own rows. Seed data (programs + exercises) is
-- world-readable to authenticated users.
--
-- APPLY THIS in your Supabase project before using auth/profile features:
--   Supabase Dashboard -> SQL Editor -> paste this file -> Run
-- (or `supabase db push` with the Supabase CLI).
--
-- Phase 2 only *uses* the `profiles` table (profile bootstrap on first login).
-- The remaining tables are proposed now for review; later phases build on them.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  coins            integer     not null default 0,
  current_streak   integer     not null default 0,
  longest_streak   integer     not null default 0,
  equipped_pet_id  text,                       -- pet registry key (e.g. 'bear')
  last_workout_date date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- programs / exercises — seed data (read-only to clients)
-- ---------------------------------------------------------------------------
create table if not exists public.programs (
  id          text primary key,               -- slug, e.g. 'push_pull_legs'
  name        text not null,
  description text,
  sort_order  integer not null default 0
);

create table if not exists public.exercises (
  id          text primary key,               -- slug, e.g. 'ppl_bench_press'
  program_id  text not null references public.programs (id) on delete cascade,
  name        text not null,
  sort_order  integer not null default 0
);
create index if not exists exercises_program_id_idx on public.exercises (program_id);

-- ---------------------------------------------------------------------------
-- workouts / workout_sets — a logged session and its sets
-- ---------------------------------------------------------------------------
create table if not exists public.workouts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  program_id       text references public.programs (id),
  started_at       timestamptz not null default now(),
  duration_seconds integer not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists workouts_user_id_idx on public.workouts (user_id, started_at desc);

create table if not exists public.workout_sets (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references public.workouts (id) on delete cascade,
  exercise_id text references public.exercises (id),
  set_index   integer not null,
  weight      numeric(7,2) not null default 0,
  reps        integer not null default 0
);
create index if not exists workout_sets_workout_id_idx on public.workout_sets (workout_id);

-- ---------------------------------------------------------------------------
-- user_pets — collected pets and their independent progression
-- ---------------------------------------------------------------------------
create table if not exists public.user_pets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  pet_id     text not null,                   -- pet registry key
  level      integer not null default 1,
  xp         integer not null default 0,
  stage      text not null default 'juvenile',
  created_at timestamptz not null default now(),
  unique (user_id, pet_id)
);

-- ---------------------------------------------------------------------------
-- eggs — earned, awaiting (or completed) hatching
-- ---------------------------------------------------------------------------
create table if not exists public.eggs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null check (type in ('standard', 'epic')),
  earned_at  timestamptz not null default now(),
  hatched_at timestamptz
);
create index if not exists eggs_user_id_idx on public.eggs (user_id);

-- ---------------------------------------------------------------------------
-- inventory — purchased cosmetics / boosts
-- ---------------------------------------------------------------------------
create table if not exists public.inventory (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  item_id    text not null,
  category   text not null,                   -- hats|glasses|outfits|auras|boosts
  equipped   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

-- ---------------------------------------------------------------------------
-- daily_challenges — one per user per day (progress tracked inline)
-- ---------------------------------------------------------------------------
create table if not exists public.daily_challenges (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  challenge_date date not null,
  kind           text not null,
  target         integer not null,
  progress       integer not null default 0,
  completed      boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (user_id, challenge_date)
);

-- ---------------------------------------------------------------------------
-- updated_at trigger for profiles
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles         enable row level security;
alter table public.programs          enable row level security;
alter table public.exercises         enable row level security;
alter table public.workouts          enable row level security;
alter table public.workout_sets      enable row level security;
alter table public.user_pets         enable row level security;
alter table public.eggs              enable row level security;
alter table public.inventory         enable row level security;
alter table public.daily_challenges  enable row level security;

-- profiles: owner-only
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- programs / exercises: read-only to any authenticated user (seed content)
drop policy if exists "programs_read" on public.programs;
create policy "programs_read" on public.programs
  for select to authenticated using (true);
drop policy if exists "exercises_read" on public.exercises;
create policy "exercises_read" on public.exercises
  for select to authenticated using (true);

-- workouts: owner-only (all actions)
drop policy if exists "workouts_all_own" on public.workouts;
create policy "workouts_all_own" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- workout_sets: scoped through the owning workout
drop policy if exists "workout_sets_all_own" on public.workout_sets;
create policy "workout_sets_all_own" on public.workout_sets
  for all using (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid())
  );

-- user_pets / eggs / inventory / daily_challenges: owner-only (all actions)
drop policy if exists "user_pets_all_own" on public.user_pets;
create policy "user_pets_all_own" on public.user_pets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "eggs_all_own" on public.eggs;
create policy "eggs_all_own" on public.eggs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "inventory_all_own" on public.inventory;
create policy "inventory_all_own" on public.inventory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "daily_challenges_all_own" on public.daily_challenges;
create policy "daily_challenges_all_own" on public.daily_challenges
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
