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
import { AuthNavigator } from './navigation/AuthNavigator';
import { MainTabs } from './navigation/RootNavigator';
import { useAuthStore } from './state/authStore';
import { navTheme } from './theme';

function Root() {
  const status = useAuthStore((s) => s.status);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => initialize(), [initialize]);

  if (status === 'loading') return <Splash />;
  return status === 'signedIn' ? <MainTabs /> : <AuthNavigator />;
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
