# Buff Buddy 🐻

A polished, production-quality mobile fitness app. Complete workouts to earn XP
and coins that level up and evolve a collectible pet. Maintain streaks and hit
weekly goals to earn eggs that hatch into new pets; duplicates convert to coins;
coins buy cosmetics in the store.

> **Core loop:** Complete workout → earn XP + coins → level up & evolve pet →
> maintain streak → earn eggs → hatch pets → collect cosmetics → repeat.

Built with **Expo (managed) + TypeScript**, **Supabase** (auth + Postgres with
RLS), **React Navigation**, and **react-native-reanimated**.

---

## Build status

This app is built in verified phases (see the build spec). **Phase 1 —
Foundation** is complete:

- ✅ Expo + TypeScript project
- ✅ 5-tab navigation (Home · Workouts · Pets · Hatch · Store) with sage active
  state + glowing active icon
- ✅ Design system tokens in [`theme/`](./theme) (colors, spacing, radius,
  shadow, typography) — no hardcoded hex in components
- ✅ Centralized economy config in [`config/economy.ts`](./config/economy.ts)
  (XP, coins, costs, odds, thresholds)
- ✅ Supabase client wired in [`lib/supabase.ts`](./lib/supabase.ts) with
  session persistence, provider-agnostic for later OAuth
- ✅ Pet registry + swappable art abstraction
  ([`pets/`](./pets)) with on-brand rendered placeholders
- ✅ [`ART_MANIFEST.md`](./ART_MANIFEST.md) listing all 27 artworks to commission
- ✅ App runs with empty-but-navigable, fully-styled screens

**Phase 2 — Auth (email/password)** is complete:

- ✅ Sign up, log in, log out with validation + error states
- ✅ Session persistence (AsyncStorage) — logins survive app restart
- ✅ Auth gate: loading splash → auth flow when signed out → main tabs when in
- ✅ Profile bootstrap on first login (`profiles` row created with starting values)
- ✅ Provider-agnostic auth layer (`lib/auth.ts`) — Google/Apple OAuth drop in
  later via `signInWithProvider(...)` with no restructuring
- ✅ Full data-model migrations proposed with RLS (`supabase/migrations/`)

**Phase 3 — Workouts + history** is complete:

- ✅ Program list loaded from the seeded DB (loading / empty / error states)
- ✅ Live session: elapsed timer, each exercise with 3 sets (weight + reps
  inputs and a per-set "done" toggle), launched as a full-screen modal
- ✅ Finish → persists the workout + every logged set to Supabase and credits
  the coins reward, with a completion summary
- ✅ History view: all past workouts (program, date, duration, set count),
  newest first, with pull-to-refresh

**Phase 4 — Progression + Home** is complete:

- ✅ First-run **starter pick** (Bear / Gorilla / Turtle) → creates + equips a pet
- ✅ XP/coins/**leveling** (multi-level rollover) and **evolution** stage
  transitions (Juvenile → Teen → Adult) applied on workout finish
- ✅ **Streak** logic (local-midnight aware: same day no-op, next day +1, gap
  resets) with current + longest tracked
- ✅ **Daily challenge** — deterministic daily rotation, progress tracked per
  workout, completion bonus (+25 XP / +15 coins)
- ✅ Workout completion summary shows real XP applied, level-ups, evolutions,
  streak, and challenge bonus
- ✅ **Home** fully wired to real data: floating idle pet + sage aura, name /
  stage / level / XP bar, stat cards, live daily challenge, Start Workout

**Phase 5 — Pets** is complete:

- ✅ Collection grid: every registry pet shown owned (sprite + level + rarity,
  ACTIVE badge for the equipped one) or as a locked silhouette
- ✅ Pet detail: hero sprite, rarity, stage, level + XP bar, blurb
- ✅ Equip action (owned pets), with the choice reflected on Home + grid

**Phase 6 — Eggs + Hatching** is complete:

- ✅ Egg earning rules: 7-day streak → Standard, 30-day streak → Epic, weekly
  goal (4 workouts Mon–Sun) → Standard (once per week), granted on finish
- ✅ Hatch sequence (Reanimated): shake → crack → flash → reveal
- ✅ Odds-based roll per egg type; new pets join the collection, duplicates
  convert to coins by rarity
- ✅ Hatch screen shows unhatched eggs + live "how to earn" progress, plus a
  dev-only "Add 10 eggs" button for testing

Phase 7 (store) follows.

> Phase 6 adds `0003_weekly_egg.sql` — apply it alongside the earlier migrations.

### Database setup (required for Phase 2+)

Apply the SQL migrations to your Supabase project once:

1. Supabase Dashboard → **SQL Editor**.
2. Run [`supabase/migrations/0001_initial_schema.sql`](./supabase/migrations/0001_initial_schema.sql)
   (tables + Row Level Security).
3. Run [`supabase/migrations/0002_seed_programs.sql`](./supabase/migrations/0002_seed_programs.sql)
   (programs + exercises seed data).

(Or, with the Supabase CLI linked to your project: `supabase db push`.)

> **Email confirmation:** by default Supabase requires email confirmation on
> sign-up. For quick local testing you can disable it under
> **Authentication → Providers → Email → Confirm email**, or just confirm via
> the link sent to your inbox before logging in.

---

## Getting started

### Prerequisites

- Node 18+ and npm
- The **Expo Go** app on your phone (or an iOS/Android simulator)

### 1. Install dependencies

```bash
npm install
```

### 2. Provide your Supabase keys

The coding agent **cannot** create the Supabase project or generate API keys —
you must do this once:

1. Create a project at <https://supabase.com> (free tier is fine).
2. Go to **Project Settings → API**.
3. Copy your **Project URL** and **anon / public** key.
4. Copy the example env file and paste them in:

   ```bash
   cp .env.example .env
   ```

   ```dotenv
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```

The anon key is safe to ship in a client app (access is gated by Row Level
Security). **Never** put the `service_role` key in `.env`.

> Until keys are provided the app still runs and navigates — it just can't talk
> to the backend yet. Database migrations are proposed for approval in Phase 2+.

### 3. Run it

```bash
npm start        # then scan the QR with Expo Go
# or
npm run ios      # iOS simulator (macOS)
npm run android  # Android emulator
```

---

## Project structure

```
config/economy.ts     # single source of truth for all tunable numbers
theme/                # design tokens (colors, spacing, typography, shadow)
lib/supabase.ts       # Supabase client (auth + db), provider-agnostic
navigation/           # 5-tab bottom navigator
screens/              # Home, Workouts, Pets, Hatch, Store
components/           # shared UI kit (Screen, Card, Button w/ spring press)
pets/                 # pet registry + <PetSprite> art abstraction
assets/pets/          # (commissioned art drops here — see ART_MANIFEST.md)
```

## Design system

Premium dark aesthetic — calm, sophisticated, motivating. Defined once in
[`theme/`](./theme) and referenced everywhere:

| Token | Hex | Use |
|---|---|---|
| `background` | `#0B0B0B` | near-black app background |
| `sage` | `#9CAF88` | primary accent |
| `sageDeep` | `#7D9270` | secondary |
| `sageLight` | `#B8C9AD` | highlights |
| `gold` | `#D4AF37` | rewards / coins |
| `purple` | `#8B5CF6` | legendary items & eggs |
| `text` | `#F5F5F5` | white text |

## Art

All pet art is **placeholder-now, swappable-later**. The app renders tasteful
rarity-tinted placeholders today; commissioned art drops into `assets/pets/` at
the exact paths in [`ART_MANIFEST.md`](./ART_MANIFEST.md) and is wired in by
pointing the registry's `image` fields at the files — no other code changes.
