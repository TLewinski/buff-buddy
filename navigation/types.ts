/**
 * navigation/types.ts — shared navigation param lists.
 */

/** Signed-in root stack (tabs + full-screen flows layered above them). */
export type RootStackParamList = {
  Main: undefined;
  WorkoutSession: { programId: string; programName: string };
  WorkoutHistory: undefined;
};

/** Bottom tabs shown inside the root "Main" screen. */
export type RootTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Pets: undefined;
  Hatch: undefined;
  Store: undefined;
};
