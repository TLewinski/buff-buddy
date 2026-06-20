/**
 * lib/progression.ts
 *
 * Pure progression math — no I/O. Leveling, evolution stage, XP-bar progress,
 * streak transitions, and the deterministic daily-challenge rotation. All
 * tunable values come from config/economy.ts.
 */

import {
  DAILY_CHALLENGES,
  stageForLevel,
  xpForLevel,
  type DailyChallengeDef,
  type Stage,
} from '../config/economy';

export interface LevelState {
  level: number;
  xp: number;
  stage: Stage;
}

export interface ApplyXpResult extends LevelState {
  leveledUp: boolean;
  stageChanged: boolean;
  fromLevel: number;
  fromStage: Stage;
}

/**
 * Apply gained XP to a pet, rolling over as many levels as the XP allows.
 * `xp` is XP accumulated toward the *current* level.
 */
export function applyXp(level: number, xp: number, gained: number): ApplyXpResult {
  const fromLevel = level;
  const fromStage = stageForLevel(level);

  let curLevel = level;
  let curXp = xp + Math.max(0, gained);

  // Roll over while we have enough XP for the next level.
  let needed = xpForLevel(curLevel);
  while (curXp >= needed) {
    curXp -= needed;
    curLevel += 1;
    needed = xpForLevel(curLevel);
  }

  const stage = stageForLevel(curLevel);
  return {
    level: curLevel,
    xp: curXp,
    stage,
    leveledUp: curLevel > fromLevel,
    stageChanged: stage !== fromStage,
    fromLevel,
    fromStage,
  };
}

export interface XpProgress {
  current: number;
  needed: number;
  ratio: number; // 0..1
}

/** XP-bar progress toward the next level. */
export function xpProgress(level: number, xp: number): XpProgress {
  const needed = xpForLevel(level);
  const ratio = needed > 0 ? Math.min(1, Math.max(0, xp / needed)) : 0;
  return { current: xp, needed, ratio };
}

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

/** Local date as YYYY-MM-DD (streaks/challenges reset at local midnight). */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local Monday 00:00 of the week containing `d` (Mon–Sun calendar week). */
export function startOfWeek(d: Date = new Date()): Date {
  const x = new Date(d);
  const mondayBased = (x.getDay() + 6) % 7; // Sun=6 ... Mon=0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - mondayBased);
  return x;
}

/** Stable identifier for a Mon–Sun week (its Monday's date key). */
export function weekKey(d: Date = new Date()): string {
  return localDateKey(startOfWeek(d));
}

/** Whole-day difference between two YYYY-MM-DD keys (b - a). */
export function dayDiff(aKey: string, bKey: string): number {
  const a = new Date(`${aKey}T00:00:00`);
  const b = new Date(`${bKey}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export interface StreakResult {
  current: number;
  longest: number;
  /** False when the user already worked out today (no streak change). */
  isNewWorkoutDay: boolean;
}

/**
 * Compute the streak after a workout completed "today".
 *  - same day as last workout -> unchanged
 *  - exactly the next day      -> +1
 *  - otherwise (gap / first)   -> reset to 1
 */
export function computeStreak(
  lastWorkoutDate: string | null,
  current: number,
  longest: number,
  today: string = localDateKey(),
): StreakResult {
  if (lastWorkoutDate === today) {
    return { current, longest: Math.max(longest, current), isNewWorkoutDay: false };
  }
  const diff = lastWorkoutDate ? dayDiff(lastWorkoutDate, today) : Infinity;
  const nextCurrent = diff === 1 ? current + 1 : 1;
  return {
    current: nextCurrent,
    longest: Math.max(longest, nextCurrent),
    isNewWorkoutDay: true,
  };
}

// ---------------------------------------------------------------------------
// Daily challenge rotation (deterministic by date)
// ---------------------------------------------------------------------------

/** Stable challenge for a given day so all clients agree without coordination. */
export function challengeForDate(dateKey: string = localDateKey()): DailyChallengeDef {
  const days = Math.floor(new Date(`${dateKey}T00:00:00`).getTime() / 86_400_000);
  const idx = ((days % DAILY_CHALLENGES.length) + DAILY_CHALLENGES.length) % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[idx];
}

/** How much a finished workout advances a challenge of the given unit. */
export function challengeProgressDelta(
  unit: DailyChallengeDef['unit'],
  durationSeconds: number,
): number {
  return unit === 'minutes' ? Math.round(durationSeconds / 60) : 1;
}
