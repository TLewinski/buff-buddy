-- =============================================================================
-- Buff Buddy — seed: programs & their exercises (spec §7)
--
-- Idempotent (upsert by id) so it can be re-run safely. Exercise ids are
-- namespaced per program because the same lift (e.g. Bench Press) appears in
-- several programs.
-- =============================================================================

insert into public.programs (id, name, description, sort_order) values
  ('push_pull_legs',   'Push Pull Legs',   'Bench Press, Overhead Press, Incline DB Press & more', 1),
  ('upper_lower',      'Upper Lower',      'Pull-Up, Barbell Row, Bench Press & more',             2),
  ('full_body_blast',  'Full Body Blast',  'Squat, Bench Press, Barbell Row & more',               3),
  ('strength_program', 'Strength Program', 'Squat, Bench Press, Deadlift & more',                  4),
  ('beginner_program', 'Beginner Program', 'Goblet Squat, Push-Up, Dumbbell Row & more',           5)
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      sort_order = excluded.sort_order;

insert into public.exercises (id, program_id, name, sort_order) values
  -- Push Pull Legs (Push day seed)
  ('ppl_bench_press',        'push_pull_legs', 'Bench Press',            1),
  ('ppl_overhead_press',     'push_pull_legs', 'Overhead Press',         2),
  ('ppl_incline_db_press',   'push_pull_legs', 'Incline Dumbbell Press', 3),
  ('ppl_triceps_pushdown',   'push_pull_legs', 'Triceps Pushdown',       4),
  ('ppl_lateral_raise',      'push_pull_legs', 'Lateral Raise',          5),
  -- Upper Lower (Upper seed)
  ('ul_pull_up',             'upper_lower',    'Pull-Up',                1),
  ('ul_barbell_row',         'upper_lower',    'Barbell Row',            2),
  ('ul_bench_press',         'upper_lower',    'Bench Press',            3),
  ('ul_overhead_press',      'upper_lower',    'Overhead Press',         4),
  ('ul_biceps_curl',         'upper_lower',    'Biceps Curl',            5),
  -- Full Body Blast
  ('fbb_squat',              'full_body_blast','Squat',                  1),
  ('fbb_bench_press',        'full_body_blast','Bench Press',            2),
  ('fbb_barbell_row',        'full_body_blast','Barbell Row',            3),
  ('fbb_overhead_press',     'full_body_blast','Overhead Press',         4),
  ('fbb_romanian_deadlift',  'full_body_blast','Romanian Deadlift',      5),
  -- Strength Program
  ('sp_squat',               'strength_program','Squat',                 1),
  ('sp_bench_press',         'strength_program','Bench Press',           2),
  ('sp_deadlift',            'strength_program','Deadlift',              3),
  ('sp_overhead_press',      'strength_program','Overhead Press',        4),
  ('sp_barbell_row',         'strength_program','Barbell Row',           5),
  -- Beginner Program
  ('bp_goblet_squat',        'beginner_program','Goblet Squat',          1),
  ('bp_push_up',             'beginner_program','Push-Up',               2),
  ('bp_dumbbell_row',        'beginner_program','Dumbbell Row',          3),
  ('bp_glute_bridge',        'beginner_program','Glute Bridge',          4),
  ('bp_plank',               'beginner_program','Plank',                 5)
on conflict (id) do update
  set program_id = excluded.program_id,
      name = excluded.name,
      sort_order = excluded.sort_order;
