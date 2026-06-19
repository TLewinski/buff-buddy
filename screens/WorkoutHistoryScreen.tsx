/**
 * screens/WorkoutHistoryScreen.tsx
 *
 * All past workouts for the signed-in user, newest first. Loading / empty /
 * error states; pull-to-refresh.
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { formatDuration, formatWorkoutDate } from '../lib/format';
import { fetchHistory, type WorkoutHistoryItem } from '../lib/workouts';
import { useAuthStore } from '../state/authStore';
import { colors, radius, spacing, typography } from '../theme';

export function WorkoutHistoryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);

  const [items, setItems] = useState<WorkoutHistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      setItems(await fetchHistory(userId));
    } catch (e: any) {
      setError(e.message ?? 'Could not load history.');
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={typography.heading}>History</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.sage} />
        }
      >
        {error ? (
          <Card>
            <Text style={typography.subheading}>Couldn't load history</Text>
            <Text style={[typography.bodyMuted, { marginTop: spacing.sm }]}>{error}</Text>
          </Card>
        ) : items === null ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.sage} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🏋️</Text>
            <Text style={typography.subheading}>No workouts yet</Text>
            <Text style={[typography.bodyMuted, { marginTop: spacing.xs, textAlign: 'center' }]}>
              Finish a session and it'll show up here.
            </Text>
          </View>
        ) : (
          items.map((w) => (
            <Card key={w.id} style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={typography.subheading}>{w.programName ?? 'Workout'}</Text>
                <Text style={[typography.caption, { marginTop: spacing.xs }]}>
                  {formatWorkoutDate(w.startedAt)}
                </Text>
              </View>
              <View style={styles.itemMeta}>
                <Text style={styles.metaValue}>{formatDuration(w.durationSeconds)}</Text>
                <Text style={typography.caption}>
                  {w.setCount} set{w.setCount === 1 ? '' : 's'}
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  itemMeta: {
    alignItems: 'flex-end',
  },
  metaValue: {
    ...typography.body,
    color: colors.sageLight,
    fontVariant: ['tabular-nums'],
  },
});
