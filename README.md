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

Phases 2–7 (auth, workouts, progression, pets, eggs, store) follow.

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
