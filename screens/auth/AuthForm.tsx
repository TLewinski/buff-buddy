/**
 * screens/auth/AuthForm.tsx
 *
 * Shared email/password form used by both Sign In and Sign Up. Handles
 * validation, submission, error + email-confirmation messaging. The auth store
 * picks up a successful sign-in via onAuthStateChange and the navigator swaps
 * to the main app automatically.
 */

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { signIn, signUp } from '../../lib/auth';
import { colors, spacing, typography } from '../../theme';

type Mode = 'signIn' | 'signUp';

interface Props {
  mode: Mode;
  onSwitchMode: () => void;
}

const COPY = {
  signIn: {
    title: 'Welcome back',
    subtitle: 'Log in to keep your streak alive.',
    cta: 'Log In',
    switchPrompt: "Don't have an account?",
    switchAction: 'Sign up',
  },
  signUp: {
    title: 'Create your account',
    subtitle: 'Start training and grow your buddy.',
    cta: 'Sign Up',
    switchPrompt: 'Already have an account?',
    switchAction: 'Log in',
  },
} as const;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function AuthForm({ mode, onSwitchMode }: Props) {
  const copy = COPY[mode];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  async function handleSubmit() {
    setFormError(null);
    setInfo(null);

    const errors: { email?: string; password?: string } = {};
    if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
    if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    setSubmitting(true);
    const result = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error ?? 'Something went wrong. Please try again.');
      return;
    }
    if (result.needsEmailConfirmation) {
      setInfo('Check your inbox to confirm your email, then log in.');
    }
    // On success the auth store + navigator handle the transition.
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <Text style={styles.logo}>🐻</Text>
          <Text style={styles.brandName}>BUFF BUDDY</Text>
        </View>

        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="you@example.com"
            error={fieldErrors.email}
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
            placeholder="••••••••"
            error={fieldErrors.password}
          />

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}

          <Button
            label={submitting ? 'Please wait…' : copy.cta}
            onPress={handleSubmit}
            disabled={submitting}
            style={{ marginTop: spacing.sm }}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={typography.bodyMuted}>{copy.switchPrompt} </Text>
          <Pressable onPress={onSwitchMode} hitSlop={8}>
            <Text style={styles.switchAction}>{copy.switchAction}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: { fontSize: 48 },
  brandName: {
    ...typography.label,
    color: colors.sage,
    marginTop: spacing.sm,
    letterSpacing: 2,
  },
  title: { ...typography.title },
  subtitle: {
    ...typography.bodyMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  form: { marginTop: spacing.sm },
  formError: {
    ...typography.body,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  info: {
    ...typography.body,
    color: colors.sage,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  switchAction: {
    ...typography.body,
    color: colors.sage,
    fontWeight: '700',
  },
});
