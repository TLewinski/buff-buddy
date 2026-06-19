/**
 * lib/database.types.ts
 *
 * Hand-written row types for the Supabase tables we read/write. Kept in sync
 * with supabase/migrations. (Can be replaced later by `supabase gen types`.)
 */

export interface Profile {
  id: string;
  coins: number;
  current_streak: number;
  longest_streak: number;
  equipped_pet_id: string | null;
  last_workout_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Columns we set explicitly when bootstrapping a new profile. */
export type NewProfile = Pick<
  Profile,
  'id' | 'coins' | 'current_streak' | 'longest_streak' | 'equipped_pet_id'
>;

export interface UserPet {
  id: string;
  user_id: string;
  pet_id: string;
  level: number;
  xp: number;
  stage: string;
  created_at: string;
}

export interface DailyChallenge {
  id: string;
  user_id: string;
  challenge_date: string;
  kind: string;
  target: number;
  progress: number;
  completed: boolean;
  created_at: string;
}

export interface Program {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface Exercise {
  id: string;
  program_id: string;
  name: string;
  sort_order: number;
}
