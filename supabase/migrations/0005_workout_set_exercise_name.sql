-- =============================================================================
-- Buff Buddy — Phase 7+: ad-hoc exercise names on sets
--
-- Custom exercises added during an (empty or template) workout aren't rows in
-- `exercises`, so a set can store its own free-text name with a null
-- exercise_id. (exercise_id was already nullable.)
-- =============================================================================

alter table public.workout_sets
  add column if not exists exercise_name text;
