import type { ExpoConfig } from 'expo/config';

/**
 * app.config.ts
 *
 * Dynamic Expo config so Supabase keys flow from `.env` -> `extra` at build
 * time (read in lib/supabase.ts). Keeps the dark sage aesthetic by forcing
 * dark UI style.
 */
const config: ExpoConfig = {
  name: 'Buff Buddy',
  slug: 'buff-buddy',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'buffbuddy',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0B0B0B',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.buffbuddy.app',
  },
  android: {
    package: 'com.buffbuddy.app',
    adaptiveIcon: {
      backgroundColor: '#0B0B0B',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
};

export default config;
