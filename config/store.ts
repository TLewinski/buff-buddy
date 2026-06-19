/**
 * config/store.ts
 *
 * The store catalog: permanent cosmetics (hats / glasses / outfits / auras) and
 * consumable boosts. Costs stay within the ranges defined in economy.ts.
 * Cosmetics use emoji placeholders today (swap for real art later); the data
 * shape is what the store + inventory operate on.
 */

import { BOOSTS, type CosmeticCategory } from './economy';

export interface StoreItem {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

const COSMETICS: StoreItem[] = [
  // Hats (150–400)
  { id: 'hat_beanie', category: 'hats', name: 'Cozy Beanie', description: 'Warm and comfy.', cost: 150, icon: '🧢' },
  { id: 'hat_party', category: 'hats', name: 'Party Hat', description: 'Always celebrating gains.', cost: 250, icon: '🎉' },
  { id: 'hat_crown', category: 'hats', name: 'Golden Crown', description: 'For the gym royalty.', cost: 400, icon: '👑' },

  // Glasses (150–300)
  { id: 'glasses_shades', category: 'glasses', name: 'Cool Shades', description: 'Too cool for cardio.', cost: 150, icon: '🕶️' },
  { id: 'glasses_round', category: 'glasses', name: 'Round Specs', description: 'Smart and studious.', cost: 220, icon: '👓' },
  { id: 'glasses_visor', category: 'glasses', name: 'Tech Visor', description: 'Future-forward focus.', cost: 300, icon: '🥽' },

  // Outfits (400–800)
  { id: 'outfit_tee', category: 'outfits', name: 'Training Tee', description: 'Light and breathable.', cost: 400, icon: '👕' },
  { id: 'outfit_hoodie', category: 'outfits', name: 'Lifter Hoodie', description: 'Pre-workout drip.', cost: 600, icon: '🧥' },
  { id: 'outfit_armor', category: 'outfits', name: 'Battle Armor', description: 'Forged for champions.', cost: 800, icon: '🛡️' },

  // Auras (600–1200)
  { id: 'aura_sage', category: 'auras', name: 'Sage Glow', description: 'A calm, grounded radiance.', cost: 600, icon: '🌿' },
  { id: 'aura_ember', category: 'auras', name: 'Ember Aura', description: 'Burning with intensity.', cost: 900, icon: '🔥' },
  { id: 'aura_cosmic', category: 'auras', name: 'Cosmic Aura', description: 'Powered by the stars.', cost: 1200, icon: '✨' },
];

const BOOST_ITEMS: StoreItem[] = Object.values(BOOSTS).map((b) => ({
  id: b.id,
  category: 'boosts' as CosmeticCategory,
  name: b.name,
  description: b.description,
  cost: b.cost,
  icon: b.affects === 'coins' ? '🪙' : '⚡️',
}));

export const STORE_ITEMS: StoreItem[] = [...COSMETICS, ...BOOST_ITEMS];

export function storeItemsByCategory(category: CosmeticCategory): StoreItem[] {
  return STORE_ITEMS.filter((i) => i.category === category);
}

export function getStoreItem(id: string): StoreItem | undefined {
  return STORE_ITEMS.find((i) => i.id === id);
}
