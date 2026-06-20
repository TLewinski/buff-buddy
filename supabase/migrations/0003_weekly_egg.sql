-- =============================================================================
-- Buff Buddy — Phase 6: weekly-goal egg tracking
--
-- Records the week (Monday date key, e.g. '2026-06-15') in which the user last
-- claimed the weekly-goal egg, so it can only be awarded once per Mon-Sun week.
-- =============================================================================

alter table public.profiles
  add column if not exists weekly_egg_week text;
