/**
 * App.tsx
 *
 * Root: gesture handler + safe area providers, dark status bar, and the
 * navigation container themed to the dark sage palette. Gates between the auth
 * flow, a loading splash, and the main tabs based on the auth store.
 */

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Splash } from './components/Splash';
import { AppNavigator } from './navigation/AppNavigator';
import { AuthNavigator } from './navigation/AuthNavigator';
import { StarterSelectScreen } from './screens/StarterSelectScreen';
import { useAuthStore } from './state/authStore';
import { navTheme } from './theme';

function Root() {
  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => initialize(), [initialize]);

  if (status === 'loading') return <Splash />;
  if (status !== 'signedIn') return <AuthNavigator />;
  // First-run onboarding: pick a starter pet before entering the app.
  if (profile && !profile.equipped_pet_id) return <StarterSelectScreen />;
  return <AppNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme}>
          <Root />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
