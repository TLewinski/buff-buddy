/**
 * navigation/AuthNavigator.tsx
 *
 * Shown when signed out. A native stack with Sign In and Sign Up screens that
 * share AuthForm; each can navigate to the other.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';
import { AuthForm } from '../screens/auth/AuthForm';
import { colors } from '../theme';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen name="SignIn">
        {({ navigation }) => (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <AuthForm mode="signIn" onSwitchMode={() => navigation.navigate('SignUp')} />
          </View>
        )}
      </Stack.Screen>
      <Stack.Screen name="SignUp">
        {({ navigation }) => (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <AuthForm mode="signUp" onSwitchMode={() => navigation.navigate('SignIn')} />
          </View>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
