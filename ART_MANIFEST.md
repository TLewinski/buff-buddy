# Buff Buddy — Art Manifest

This document lists **every artwork the app expects**. The code renders
placeholders today; to ship final art, the commissioned files drop into
`assets/pets/` at the **exact paths below**, then each pet's `art[stage].image`
field in [`pets/registry.ts`](./pets/registry.ts) is pointed at the file with
`require(...)`. No other code changes are required.

## Intended style

Cel-shaded, bold outlines, expressive faces — one cohesive, cozy, Pokémon-ish
look across all pets. Each pet has **3 distinct evolution stages** that should
read as the same creature growing up, not just a scaled copy:

- **Juvenile** — small, cute, big-headed baby proportions.
- **Teen** — leaner, more athletic, mid-growth.
- **Adult** — fully grown, powerful, heroic silhouette.

## Technical spec (every file)

| Property | Value |
|---|---|
| Format | PNG, transparent background |
| Canvas | **1024 × 1024 px**, square |
| Safe area | Keep the creature within the centered ~85% so it isn't clipped by the circular frame |
| Color | sRGB; designed to sit on a near-black `#0B0B0B` background |
| Naming | `{petId}_{stage}.png`, all lowercase |
| Location | `assets/pets/` |

> Optional: ship `@2x` / `@3x` variants if file size matters, but a single
> 1024² asset scales cleanly for the sizes used in-app.

## Required files (9 pets × 3 stages = 27)

### Starters

| Pet | Rarity | File path |
|---|---|---|
| Bear | common | `assets/pets/bear_juvenile.png` |
| Bear | common | `assets/pets/bear_teen.png` |
| Bear | common | `assets/pets/bear_adult.png` |
| Gorilla | common | `assets/pets/gorilla_juvenile.png` |
| Gorilla | common | `assets/pets/gorilla_teen.png` |
| Gorilla | common | `assets/pets/gorilla_adult.png` |
| Turtle | common | `assets/pets/turtle_juvenile.png` |
| Turtle | common | `assets/pets/turtle_teen.png` |
| Turtle | common | `assets/pets/turtle_adult.png` |

### Egg pets

| Pet | Rarity | File path |
|---|---|---|
| Wolf | common | `assets/pets/wolf_juvenile.png` |
| Wolf | common | `assets/pets/wolf_teen.png` |
| Wolf | common | `assets/pets/wolf_adult.png` |
| Eagle | rare | `assets/pets/eagle_juvenile.png` |
| Eagle | rare | `assets/pets/eagle_teen.png` |
| Eagle | rare | `assets/pets/eagle_adult.png` |
| Tiger | rare | `assets/pets/tiger_juvenile.png` |
| Tiger | rare | `assets/pets/tiger_teen.png` |
| Tiger | rare | `assets/pets/tiger_adult.png` |
| Lion | epic | `assets/pets/lion_juvenile.png` |
| Lion | epic | `assets/pets/lion_teen.png` |
| Lion | epic | `assets/pets/lion_adult.png` |
| Dragon | epic | `assets/pets/dragon_juvenile.png` |
| Dragon | epic | `assets/pets/dragon_teen.png` |
| Dragon | epic | `assets/pets/dragon_adult.png` |
| Phoenix | legendary | `assets/pets/phoenix_juvenile.png` |
| Phoenix | legendary | `assets/pets/phoenix_teen.png` |
| Phoenix | legendary | `assets/pets/phoenix_adult.png` |

## Eggs (additional art, optional for v1)

The Hatch screen (Phase 6) will use two egg visuals. Placeholders are rendered
in-app; commission these to match the pet style:

| Egg | File path | Notes |
|---|---|---|
| Standard Egg | `assets/eggs/egg_standard.png` | Sage / neutral shell |
| Epic Egg | `assets/eggs/egg_epic.png` | Purple, more ornate |

## How to drop in real art (one-time, per file)

1. Export the file at the path in the tables above.
2. In `pets/registry.ts`, replace `image: null` for that pet/stage with
   `image: require('../assets/pets/<file>.png')`.
3. That's it — `<PetSprite>` automatically renders the image instead of the
   placeholder everywhere it appears.

> ⚠️ A coding agent cannot produce hand-drawn cel-shaded art. These files must
> be commissioned. Everything else (rendering, animation, layout) is already
> wired up against this manifest.
