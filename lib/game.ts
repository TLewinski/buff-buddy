/**
 * lib/game.ts
 *
 * Higher-level game mutations + reads built on the pure progression math:
 *  - grantStarter: first-run starter pet selection
 *  - ensureTodayChallenge: get-or-create the deterministic daily challenge
 *  - fetchHomeData: everything the Home screen renders
 *  - finishWorkout: persist a session and apply the full reward flow
 *    (coins, XP -> equipped pet leveling/evolution, streak, daily challenge)
 */

import {
  DAILY_CHALLENGES,
  REWARDS,
  type DailyChallengeDef,
  type Stage,
} from '../config/economy';
import { getPet, PETS } from '../pets/registry';
import type { DailyChallenge, Profile, UserPet } from './database.types';
import {
  applyXp,
  challengeForDate,
  challengeProgressDelta,
  computeStreak,
  localDateKey,
  xpProgress,
  type XpProgress,
} from './progression';
import { supabase } from './supabase';
import type { LoggedSet } from './workouts';

// ---------------------------------------------------------------------------
// Starter selection
// ---------------------------------------------------------------------------

export async function grantStarter(userId: string, petId: string): Promise<{ ok: boolean; error?: string }> {
  const { error: petError } = await supabase.from('user_pets').upsert(
    { user_id: userId, pet_id: petId, level: 1, xp: 0, stage: 'juvenile' satisfies Stage },
    { onConflict: 'user_id,pet_id', ignoreDuplicates: true },
  );
  if (petError) return { ok: false, error: petError.message };

  const { error: profError } = await supabase
    .from('profiles')
    .update({ equipped_pet_id: petId })
    .eq('id', userId);
  if (profError) return { ok: false, error: profError.message };

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Collection (Pets screen)
// ---------------------------------------------------------------------------

export interface CollectionPet {
  petId: string;
  name: string;
  rarity: string;
  source: 'starter' | 'egg';
  blurb: string;
  owned: boolean;
  equipped: boolean;
  level: number | null;
  xp: number | null;
  stage: Stage | null;
  progress: XpProgress | null;
}

export interface Collection {
  pets: CollectionPet[];
  ownedCount: number;
  total: number;
  equippedPetId: string | null;
}

/** The full registry annotated with this user's ownership / equip state. */
export async function fetchCollection(userId: string): Promise<Collection> {
  const [{ data: profile }, { data: ownedRows }] = await Promise.all([
    supabase.from('profiles').select('equipped_pet_id').eq('id', userId).single(),
    supabase.from('user_pets').select('pet_id, level, xp, stage').eq('user_id', userId),
  ]);

  const equippedPetId = profile?.equipped_pet_id ?? null;
  const ownedById = new Map((ownedRows ?? []).map((r) => [r.pet_id, r]));

  const pets: CollectionPet[] = Object.values(PETS).map((def) => {
    const row = ownedById.get(def.id);
    return {
      petId: def.id,
      name: def.name,
      rarity: def.rarity,
      source: def.source,
      blurb: def.blurb,
      owned: !!row,
      equipped: equippedPetId === def.id,
      level: row?.level ?? null,
      xp: row?.xp ?? null,
      stage: (row?.stage as Stage) ?? null,
      progress: row ? xpProgress(row.level, row.xp) : null,
    };
  });

  return {
    pets,
    ownedCount: ownedById.size,
    total: pets.length,
    equippedPetId,
  };
}

/** Detail for one pet (owned info + equip state). */
export async function fetchPetDetail(userId: string, petId: string): Promise<CollectionPet | null> {
  const collection = await fetchCollection(userId);
  return collection.pets.find((p) => p.petId === petId) ?? null;
}

/** Equip an owned pet. No-op-safe; rejects pets the user doesn't own. */
export async function equipPet(
  userId: string,
  petId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: owned } = await supabase
    .from('user_pets')
    .select('pet_id')
    .eq('user_id', userId)
    .eq('pet_id', petId)
    .maybeSingle();
  if (!owned) return { ok: false, error: "You don't own this pet yet." };

  const { error } = await supabase
    .from('profiles')
    .update({ equipped_pet_id: petId })
    .eq('id', userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Daily challenge
// ---------------------------------------------------------------------------

function challengeDefByKind(kind: string): DailyChallengeDef {
  return DAILY_CHALLENGES.find((c) => c.kind === kind) ?? DAILY_CHALLENGES[0];
}

/** Get today's challenge row, creating it from the deterministic rotation. */
export async function ensureTodayChallenge(userId: string): Promise<DailyChallenge | null> {
  const today = localDateKey();
  const { data: existing } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_date', today)
    .maybeSingle();
  if (existing) return existing as DailyChallenge;

  const def = challengeForDate(today);
  const { data: created, error } = await supabase
    .from('daily_challenges')
    .insert({
      user_id: userId,
      challenge_date: today,
      kind: def.kind,
      target: def.target,
      progress: 0,
      completed: false,
    })
    .select('*')
    .single();
  if (error) return null;
  return created as DailyChallenge;
}

// ---------------------------------------------------------------------------
// Home data
// ---------------------------------------------------------------------------

export interface HomeEquippedPet {
  petId: string;
  name: string;
  rarity: string;
  level: number;
  xp: number;
  stage: Stage;
  progress: XpProgress;
}

export interface HomeChallenge {
  title: string;
  unit: DailyChallengeDef['unit'];
  progress: number;
  target: number;
  completed: boolean;
  rewardXp: number;
  rewardCoins: number;
}

export interface HomeData {
  coins: number;
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  petsOwned: number;
  pet: HomeEquippedPet | null;
  challenge: HomeChallenge | null;
}

export async function fetchHomeData(userId: string): Promise<HomeData> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('coins, current_streak, longest_streak, equipped_pet_id')
    .eq('id', userId)
    .single();

  const [{ count: totalWorkouts }, { count: petsOwned }] = await Promise.all([
    supabase.from('workouts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_pets').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  let pet: HomeEquippedPet | null = null;
  if (profile?.equipped_pet_id) {
    const { data: up } = await supabase
      .from('user_pets')
      .select('pet_id, level, xp, stage')
      .eq('user_id', userId)
      .eq('pet_id', profile.equipped_pet_id)
      .maybeSingle();
    if (up) {
      const def = getPet(up.pet_id);
      pet = {
        petId: up.pet_id,
        name: def?.name ?? up.pet_id,
        rarity: def?.rarity ?? 'common',
        level: up.level,
        xp: up.xp,
        stage: up.stage as Stage,
        progress: xpProgress(up.level, up.xp),
      };
    }
  }

  const challengeRow = await ensureTodayChallenge(userId);
  let challenge: HomeChallenge | null = null;
  if (challengeRow) {
    const def = challengeDefByKind(challengeRow.kind);
    challenge = {
      title: def.title,
      unit: def.unit,
      progress: challengeRow.progress,
      target: challengeRow.target,
      completed: challengeRow.completed,
      rewardXp: REWARDS.dailyChallenge.xp,
      rewardCoins: REWARDS.dailyChallenge.coins,
    };
  }

  return {
    coins: profile?.coins ?? 0,
    currentStreak: profile?.current_streak ?? 0,
    longestStreak: profile?.longest_streak ?? 0,
    totalWorkouts: totalWorkouts ?? 0,
    petsOwned: petsOwned ?? 0,
    pet,
    challenge,
  };
}

// ---------------------------------------------------------------------------
// Finish workout — full reward flow
// ---------------------------------------------------------------------------

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
  xpApplied: number;
  // Pet progression (null when the user has no equipped pet).
  petId: string | null;
  fromLevel: number;
  newLevel: number;
  leveledUp: boolean;
  fromStage: Stage | null;
  newStage: Stage | null;
  stageChanged: boolean;
  // Streak + challenge.
  streakCurrent: number;
  challengeCompleted: boolean;
}

export async function finishWorkout(input: FinishWorkoutInput): Promise<FinishWorkoutResult> {
  const base: FinishWorkoutResult = {
    ok: false,
    coinsAwarded: 0,
    xpApplied: 0,
    petId: null,
    fromLevel: 0,
    newLevel: 0,
    leveledUp: false,
    fromStage: null,
    newStage: null,
    stageChanged: false,
    streakCurrent: 0,
    challengeCompleted: false,
  };
  const fail = (error: string): FinishWorkoutResult => ({ ...base, error });

  // 1. Persist the workout + sets.
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

  const today = localDateKey();

  // 2. Load profile + equipped pet + today's challenge.
  const { data: profile } = await supabase
    .from('profiles')
    .select('coins, current_streak, longest_streak, last_workout_date, equipped_pet_id')
    .eq('id', input.userId)
    .single();
  if (!profile) return fail('Profile not found.');

  const p = profile as Pick<
    Profile,
    'coins' | 'current_streak' | 'longest_streak' | 'last_workout_date' | 'equipped_pet_id'
  >;

  const challengeRow = await ensureTodayChallenge(input.userId);

  // 3. Streak.
  const streak = computeStreak(p.last_workout_date, p.current_streak, p.longest_streak, today);

  // 4. Daily challenge progress / completion.
  let challengeCompleted = false;
  let bonusCoins = 0;
  let bonusXp = 0;
  if (challengeRow && !challengeRow.completed) {
    const def = challengeDefByKind(challengeRow.kind);
    const nextProgress =
      challengeRow.progress + challengeProgressDelta(def.unit, input.durationSeconds);
    const nowCompleted = nextProgress >= challengeRow.target;
    await supabase
      .from('daily_challenges')
      .update({ progress: nextProgress, completed: nowCompleted })
      .eq('id', challengeRow.id);
    if (nowCompleted) {
      challengeCompleted = true;
      bonusCoins = REWARDS.dailyChallenge.coins;
      bonusXp = REWARDS.dailyChallenge.xp;
    }
  }

  // 5. Totals.
  const totalCoins = REWARDS.workout.coins + bonusCoins;
  const totalXp = REWARDS.workout.xp + bonusXp;

  // 6. Apply XP to the equipped pet.
  let petResult: FinishWorkoutResult = { ...base };
  if (p.equipped_pet_id) {
    const { data: up } = await supabase
      .from('user_pets')
      .select('level, xp, stage')
      .eq('user_id', input.userId)
      .eq('pet_id', p.equipped_pet_id)
      .maybeSingle();
    if (up) {
      const result = applyXp(up.level, up.xp, totalXp);
      await supabase
        .from('user_pets')
        .update({ level: result.level, xp: result.xp, stage: result.stage })
        .eq('user_id', input.userId)
        .eq('pet_id', p.equipped_pet_id);
      petResult = {
        ...petResult,
        petId: p.equipped_pet_id,
        fromLevel: result.fromLevel,
        newLevel: result.level,
        leveledUp: result.leveledUp,
        fromStage: result.fromStage,
        newStage: result.stage,
        stageChanged: result.stageChanged,
      };
    }
  }

  // 7. Persist profile updates (coins + streak + last workout date).
  await supabase
    .from('profiles')
    .update({
      coins: p.coins + totalCoins,
      current_streak: streak.current,
      longest_streak: streak.longest,
      last_workout_date: today,
    })
    .eq('id', input.userId);

  return {
    ...petResult,
    ok: true,
    coinsAwarded: totalCoins,
    xpApplied: totalXp,
    streakCurrent: streak.current,
    challengeCompleted,
  };
}
