import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../icons/Icon';

export default function LoginScreen({ onNavigateRegister, onNavigateForgot }) {
  const { theme, isDark } = useTheme();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('elena_v');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter your username/email and password.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await login(identifier.trim(), password);
      if (!res.success) {
        setErrorMsg(res.error?.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error connecting to Connectly.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (user, pass) => {
    setIdentifier(user);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Brand Splash / Hero */}
        <View style={styles.brandHero}>
          <View style={[styles.logoBadge, { backgroundColor: theme.colors.primary }]}>
            <Icon name="logo" size={32} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>Connectly</Text>
          <Text style={[styles.brandTagline, { color: theme.colors.textSecondary }]}>
            Ambient Social & Real-time Sphere
          </Text>
        </View>

        {/* Demo Fast Login Pills */}
        <View style={styles.demoSection}>
          <Text style={[styles.demoTitle, { color: theme.colors.textTertiary }]}>⚡ Quick Demo Sign In:</Text>
          <View style={styles.demoPillsRow}>
            <TouchableOpacity
              style={[styles.demoPill, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
              onPress={() => setDemoUser('elena_v', 'Password123!')}
            >
              <Text style={[styles.demoPillText, { color: theme.colors.primary }]}>Elena Rostova</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoPill, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
              onPress={() => setDemoUser('marcus_dev', 'Password123!')}
            >
              <Text style={[styles.demoPillText, { color: theme.colors.secondary }]}>Marcus Chen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoPill, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
              onPress={() => setDemoUser('connectly_admin', 'Password123!')}
            >
              <Text style={[styles.demoPillText, { color: theme.colors.accent }]}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Inputs */}
        <View style={styles.formContainer}>
          {errorMsg ? (
            <View style={[styles.errorBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: theme.colors.danger }]}>
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Identifier Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Username or Email</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary }]}
                placeholder="e.g. elena_v or elena@connectly.app"
                placeholderTextColor={theme.colors.textTertiary}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Password</Text>
              <TouchableOpacity onPress={onNavigateForgot}>
                <Text style={[styles.forgotText, { color: theme.colors.primary }]}>Forgot?</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary }]}
                placeholder="••••••••••••"
                placeholderTextColor={theme.colors.textTertiary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: theme.colors.primary }, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Log In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer / Switch to Register */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={onNavigateRegister}>
            <Text style={[styles.signUpText, { color: theme.colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%'
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 24
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  brandTagline: {
    fontSize: 14,
    marginTop: 4
  },
  demoSection: {
    marginBottom: 20,
    alignItems: 'center'
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  demoPillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  demoPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1
  },
  demoPillText: {
    fontSize: 11.5,
    fontWeight: '700'
  },
  formContainer: {
    marginBottom: 20
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 6
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14
  },
  eyeBtn: {
    padding: 4
  },
  loginBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  footerText: {
    fontSize: 13.5
  },
  signUpText: {
    fontSize: 13.5,
    fontWeight: '700'
  }
});
