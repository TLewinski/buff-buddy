/**
 * lib/workouts.ts
 *
 * Data access for programs, workout sessions, and history. Programs/exercises
 * come from the seeded tables; finishing a session persists the workout + every
 * logged set and credits coins to the profile.
 *
 * NOTE (phase boundary): Phase 3 credits the workout's *coins* reward. XP /
 * leveling / streaks / daily-challenge updates are wired in Phase 4 (they need
 * the pet + streak + challenge machinery), so this module intentionally only
 * touches coins for now.
 */

import type { Exercise, Program } from './database.types';
import { supabase } from './supabase';

export interface ProgramWithExercises extends Program {
  exercises: Exercise[];
}

export interface LoggedSet {
  exerciseId: string;
  setIndex: number;
  weight: number;
  reps: number;
}

export interface WorkoutHistoryItem {
  id: string;
  programName: string | null;
  startedAt: string;
  durationSeconds: number;
  setCount: number;
}

/** All programs with their exercises, both sorted by sort_order. */
export async function fetchPrograms(): Promise<ProgramWithExercises[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('id, name, description, sort_order, exercises ( id, program_id, name, sort_order )');

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as (Program & { exercises: Exercise[] })[];
  return rows
    .map((p) => ({
      ...p,
      exercises: [...(p.exercises ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** A single program's exercises, sorted. */
export async function fetchProgramExercises(programId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, program_id, name, sort_order')
    .eq('program_id', programId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Exercise[];
}

/** All of a user's past workouts, newest first, with program name + set count. */
export async function fetchHistory(userId: string): Promise<WorkoutHistoryItem[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, started_at, duration_seconds, programs ( name ), workout_sets ( count )')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((w: any) => ({
    id: w.id,
    programName: w.programs?.name ?? null,
    startedAt: w.started_at,
    durationSeconds: w.duration_seconds,
    setCount: w.workout_sets?.[0]?.count ?? 0,
  }));
}
