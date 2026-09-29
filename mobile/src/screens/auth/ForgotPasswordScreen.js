import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import Icon from '../../icons/Icon';

export default function ForgotPasswordScreen({ onNavigateLogin }) {
  const { theme } = useTheme();
  const [step, setStep] = useState(1); // 1: request OTP, 2: verify & reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your account email.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      if (res.success) {
        setStep(2);
        setStatusMsg('A 6-digit recovery code has been sent to your email.');
        if (res.data?.devOtp) {
          setOtp(res.data.devOtp); // Convenience in development
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error sending recovery code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword) {
      setErrorMsg('Please enter both the OTP and new password.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.resetPassword(email.trim(), otp.trim(), newPassword);
      if (res.success) {
        setStatusMsg('Password reset successfully! Please log in.');
        setTimeout(() => {
          onNavigateLogin && onNavigateLogin();
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity onPress={onNavigateLogin} style={styles.backBtn}>
          <Icon name="back" size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Password Recovery</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {step === 1
              ? 'Enter your account email to receive a verification OTP'
              : 'Enter the 6-digit code and choose a new secure password'}
          </Text>
        </View>

        {statusMsg ? (
          <View style={[styles.statusBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: theme.colors.success }]}>
            <Text style={[styles.statusText, { color: theme.colors.success }]}>{statusMsg}</Text>
          </View>
        ) : null}

        {errorMsg ? (
          <View style={[styles.errorBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: theme.colors.danger }]}>
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errorMsg}</Text>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email Address</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                  placeholder="elena@connectly.app"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary }, loading && { opacity: 0.7 }]}
              onPress={handleRequestOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.actionBtnText}>Send Recovery Code</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>6-Digit OTP Code</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.colors.textPrimary, letterSpacing: 4, fontWeight: '700' }]}
                  placeholder="123456"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>New Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={theme.colors.textTertiary}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary }, loading && { opacity: 0.7 }]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.actionBtnText}>Reset Password & Log In</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 24,
    paddingTop: 50
  },
  backBtn: {
    padding: 6,
    marginBottom: 20
  },
  header: {
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18
  },
  statusBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
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
  form: {
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6
  },
  inputWrapper: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center'
  },
  input: {
    fontSize: 14
  },
  actionBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  }
});
