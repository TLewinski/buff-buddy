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

import { REWARDS } from '../config/economy';
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

export interface FinishWorkoutInput {
  userId: string;
  programId: string;
  startedAt: string;
  durationSeconds: number;
  sets: LoggedSet[];
}

export interface FinishWorkoutResult {
  ok: boolean;
  error?: string;
  coinsAwarded: number;
  /** Shown in the summary; applied to the equipped pet in Phase 4. */
  xpEarned: number;
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

/** Persist a completed session (workout + sets) and credit coins. */
export async function finishWorkout(input: FinishWorkoutInput): Promise<FinishWorkoutResult> {
  const fail = (error: string): FinishWorkoutResult => ({
    ok: false,
    error,
    coinsAwarded: 0,
    xpEarned: 0,
  });

  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      user_id: input.userId,
      program_id: input.programId,
      started_at: input.startedAt,
      duration_seconds: input.durationSeconds,
    })
    .select('id')
    .single();

  if (workoutError || !workout) return fail(workoutError?.message ?? 'Could not save workout.');

  if (input.sets.length > 0) {
    const rows = input.sets.map((s) => ({
      workout_id: workout.id,
      exercise_id: s.exerciseId,
      set_index: s.setIndex,
      weight: s.weight,
      reps: s.reps,
    }));
    const { error: setsError } = await supabase.from('workout_sets').insert(rows);
    if (setsError) return fail(setsError.message);
  }

  // Credit coins (read-modify-write; single-user rows so contention is a non-issue).
  const { data: prof } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', input.userId)
    .single();
  const newCoins = (prof?.coins ?? 0) + REWARDS.workout.coins;
  await supabase.from('profiles').update({ coins: newCoins }).eq('id', input.userId);

  return { ok: true, coinsAwarded: REWARDS.workout.coins, xpEarned: REWARDS.workout.xp };
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
