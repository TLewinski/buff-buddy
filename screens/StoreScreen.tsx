/**
 * screens/StoreScreen.tsx
 *
 * Tabbed store: Hats / Glasses / Outfits / Auras / Boosts. Buy with coins;
 * cosmetics are permanent unlocks you can equip/unequip, boosts are consumables
 * that become active and apply to workout rewards.
 */

import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import type { CosmeticCategory } from '../config/economy';
import { buyItem, equipCosmetic, fetchStore, type StoreEntry, type StoreState } from '../lib/store';
import { useAuthStore } from '../state/authStore';
import { colors, radius, spacing, typography } from '../theme';

const CATEGORIES: { key: CosmeticCategory; label: string }[] = [
  { key: 'hats', label: 'Hats' },
  { key: 'glasses', label: 'Glasses' },
  { key: 'outfits', label: 'Outfits' },
  { key: 'auras', label: 'Auras' },
  { key: 'boosts', label: 'Boosts' },
];

export function StoreScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [active, setActive] = useState<CosmeticCategory>('hats');
  const [store, setStore] = useState<StoreState | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(() => {
    let alive = true;
    if (!userId) return;
    fetchStore(userId)
      .then((s) => alive && setStore(s))
      .catch(() => alive && setStore(null));
    return () => {
      alive = false;
    };
  }, [userId]);

  useFocusEffect(load);

  async function refresh() {
    if (!userId) return;
    setStore(await fetchStore(userId));
    await refreshProfile();
  }

  async function onBuy(item: StoreEntry) {
    if (!userId || !store) return;
    if (store.coins < item.cost) {
      Alert.alert('Not enough coins', `You need ${item.cost - store.coins} more coins.`);
      return;
    }
    Alert.alert('Buy ' + item.name + '?', `This costs ${item.cost} coins.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Buy',
        onPress: async () => {
          setPending(item.id);
          const res = await buyItem(userId, item.id);
          setPending(null);
          if (!res.ok) {
            Alert.alert('Purchase failed', res.error ?? 'Please try again.');
            return;
          }
          await refresh();
        },
      },
    ]);
  }

  async function onEquip(item: StoreEntry) {
    if (!userId) return;
    setPending(item.id);
    const res = await equipCosmetic(userId, item.id);
    setPending(null);
    if (!res.ok) {
      Alert.alert('Could not equip', res.error ?? 'Please try again.');
      return;
    }
    await refresh();
  }

  const entries = store?.entries.filter((e) => e.category === active) ?? [];

  return (
    <Screen eyebrow="Spend Your Coins" title="Store">
      <Card style={styles.balance}>
        <Text style={typography.label}>BALANCE</Text>
        <Text style={[typography.title, { color: colors.gold }]}>{store?.coins ?? 0} 🪙</Text>
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

      {!store ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.sage} />
        </View>
      ) : (
        entries.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            balance={store.coins}
            busy={pending === item.id}
            onBuy={() => onBuy(item)}
            onEquip={() => onEquip(item)}
          />
        ))
      )}
    </Screen>
  );
}

function ItemRow({
  item,
  balance,
  busy,
  onBuy,
  onEquip,
}: {
  item: StoreEntry;
  balance: number;
  busy: boolean;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const isBoost = item.category === 'boosts';
  const affordable = balance >= item.cost;

  let action: React.ReactNode;
  if (isBoost) {
    action = item.active ? (
      <Tag label="ACTIVE" tone={colors.sage} />
    ) : (
      <BuyButton cost={item.cost} affordable={affordable} busy={busy} onPress={onBuy} />
    );
  } else if (!item.owned) {
    action = <BuyButton cost={item.cost} affordable={affordable} busy={busy} onPress={onBuy} />;
  } else {
    action = (
      <Pressable
        onPress={onEquip}
        disabled={busy}
        style={[styles.equipBtn, item.equipped && styles.equipBtnOn]}
      >
        <Text style={[styles.equipText, item.equipped && { color: colors.background }]}>
          {item.equipped ? 'Equipped' : 'Equip'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Card style={styles.item}>
      <View style={styles.icon}>
        <Text style={{ fontSize: 26 }}>{item.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={typography.subheading}>{item.name}</Text>
        <Text style={[typography.caption, { marginTop: 2 }]}>{item.description}</Text>
      </View>
      <View style={styles.action}>{action}</View>
    </Card>
  );
}

function BuyButton({
  cost,
  affordable,
  busy,
  onPress,
}: {
  cost: number;
  affordable: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={[styles.buyBtn, !affordable && styles.buyBtnDisabled]}
    >
      <Text style={[styles.buyText, !affordable && { color: colors.textFaint }]}>{cost} 🪙</Text>
    </Pressable>
  );
}

function Tag({ label, tone }: { label: string; tone: string }) {
  return (
    <View style={[styles.tag, { borderColor: tone }]}>
      <Text style={[styles.tagText, { color: tone }]}>{label}</Text>
    </View>
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
  loading: {
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  action: {
    marginLeft: spacing.md,
  },
  buyBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buyBtnDisabled: {
    backgroundColor: colors.surfaceRaised,
  },
  buyText: {
    ...typography.label,
    color: colors.background,
    fontWeight: '800',
  },
  equipBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.sage,
  },
  equipBtnOn: {
    backgroundColor: colors.sage,
  },
  equipText: {
    ...typography.label,
    color: colors.sage,
  },
  tag: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tagText: {
    ...typography.label,
    fontWeight: '800',
  },
});
