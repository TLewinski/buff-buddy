/**
 * components/Screen.tsx
 *
 * Standard screen shell: dark background, safe-area aware, optional scrolling,
 * and an optional title/eyebrow header that matches the reference layouts.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';

interface Props {
  children: React.ReactNode;
  /** Small uppercase eyebrow above the title (e.g. "YOUR COLLECTION"). */
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Optional action rendered at the top-right of the header (e.g. sign out). */
  headerRight?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  eyebrow,
  title,
  subtitle,
  headerRight,
  scroll = true,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();

  const header = (eyebrow || title || subtitle || headerRight) && (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
    </View>
  );

  const padded: ViewStyle = {
    paddingTop: insets.top + spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  };

  if (scroll) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={[padded, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {header}
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, padded, contentStyle]}>
      {header}
      {children}
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerText: {
    flex: 1,
  },
  headerRight: {
    marginLeft: spacing.md,
    paddingTop: spacing.xs,
  },
  eyebrow: {
    ...typography.label,
    color: colors.sage,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginTop: spacing.sm,
  },
});
