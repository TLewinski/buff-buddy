-- =============================================================================
-- Buff Buddy — Phase 7: active (consumable) boosts
--
-- A purchased boost becomes an active_boosts row. `next_workout` boosts are
-- consumed on the next finished workout; `duration_24h` boosts apply until
-- expires_at. finishWorkout reads these to multiply XP / coin rewards.
-- (Permanent cosmetics live in the existing `inventory` table.)
-- =============================================================================

create table if not exists public.active_boosts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  boost_id   text not null,
  affects    text not null,                  -- 'xp' | 'coins'
  multiplier numeric(4,2) not null,
  mode       text not null,                  -- 'next_workout' | 'duration_24h'
  expires_at timestamptz,
  consumed   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists active_boosts_user_idx
  on public.active_boosts (user_id, consumed);

alter table public.active_boosts enable row level security;

drop policy if exists "active_boosts_all_own" on public.active_boosts;
create policy "active_boosts_all_own" on public.active_boosts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
