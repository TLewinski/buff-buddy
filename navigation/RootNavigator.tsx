/**
 * navigation/RootNavigator.tsx
 *
 * The main app tab bar (shown when signed in): Home · Workouts · Pets · Hatch ·
 * Store. Active state uses the sage palette with a soft glow behind the active
 * icon. The signed-out / loading gating lives in App.tsx.
 */

import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarButtonProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { HatchScreen } from '../screens/HatchScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PetsScreen } from '../screens/PetsScreen';
import { StoreScreen } from '../screens/StoreScreen';
import { WorkoutsScreen } from '../screens/WorkoutsScreen';
import { colors, shadow, spacing } from '../theme';

export type RootTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Pets: undefined;
  Hatch: undefined;
  Store: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Workouts: 'barbell',
  Pets: 'paw',
  Hatch: 'egg',
  Store: 'bag-handle',
};

/** Tab button without the default ripple/opacity so the icon glow reads cleanly. */
function TabButton({ children, onPress, accessibilityState }: BottomTabBarButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={accessibilityState ?? undefined}
      onPress={onPress ?? undefined}
      android_ripple={null}
      style={styles.tabButton}
    >
      {children}
    </Pressable>
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.sage,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarButton: (props) => <TabButton {...props} />,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, focused, size }) => {
          const name = ICONS[route.name as keyof RootTabParamList];
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={name} size={size ?? 22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Workouts" component={WorkoutsScreen} />
      <Tab.Screen name="Pets" component={PetsScreen} />
      <Tab.Screen name="Hatch" component={HatchScreen} />
      <Tab.Screen name="Store" component={StoreScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 88,
    paddingTop: spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(156, 175, 136, 0.16)',
    ...shadow.glow,
    shadowOpacity: 0.45,
  },
});
