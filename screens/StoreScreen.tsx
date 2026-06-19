/**
 * screens/StoreScreen.tsx
 *
 * Phase 1: category tabs shell + coin balance header. Purchase flow, unlocks,
 * and equipping land in Phase 7.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import type { CosmeticCategory } from '../config/economy';
import { STORE_PRICE_RANGES } from '../config/economy';
import { colors, radius, spacing, typography } from '../theme';

const CATEGORIES: { key: CosmeticCategory; label: string }[] = [
  { key: 'hats', label: 'Hats' },
  { key: 'glasses', label: 'Glasses' },
  { key: 'outfits', label: 'Outfits' },
  { key: 'auras', label: 'Auras' },
  { key: 'boosts', label: 'Boosts' },
];

export function StoreScreen() {
  const [active, setActive] = useState<CosmeticCategory>('hats');
  const range = STORE_PRICE_RANGES[active];

  return (
    <Screen eyebrow="Spend Your Coins" title="Store">
      <Card style={styles.balance}>
        <Text style={typography.label}>BALANCE</Text>
        <Text style={[typography.title, { color: colors.gold }]}>0 ◎</Text>
      </Card>

      <View style={styles.tabs}>
        {CATEGORIES.map((c) => {
          const selected = c.key === active;
          return (
            <Pressable
              key={c.key}
              onPress={() => setActive(c.key)}
              style={[styles.tab, selected && styles.tabActive]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextActive]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
        <Text style={typography.bodyMuted}>
          {CATEGORIES.find((c) => c.key === active)?.label} coming in Phase 7
        </Text>
        <Text style={[typography.caption, { marginTop: spacing.sm }]}>
          {range.min}–{range.max} coins
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  balance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  tabText: {
    ...typography.label,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.background,
  },
});
