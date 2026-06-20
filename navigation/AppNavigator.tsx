/**
 * navigation/AppNavigator.tsx
 *
 * Signed-in root: the bottom tabs plus full-screen flows layered above them
 * (the live workout session as a modal, and the history view as a card). Both
 * are reachable from the Workouts tab (and later from Home), so they live at
 * the root rather than inside a tab.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { PetDetailScreen } from '../screens/PetDetailScreen';
import { WorkoutHistoryScreen } from '../screens/WorkoutHistoryScreen';
import { WorkoutSessionScreen } from '../screens/WorkoutSessionScreen';
import { colors } from '../theme';
import { MainTabs } from './RootNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="WorkoutSession"
        component={WorkoutSessionScreen}
        options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
      />
      <Stack.Screen
        name="WorkoutHistory"
        component={WorkoutHistoryScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen name="PetDetail" component={PetDetailScreen} options={{ presentation: 'card' }} />
    </Stack.Navigator>
  );
}
