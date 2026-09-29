import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../icons/Icon';

export default function SettingsScreen({ onBack, onOpenAdmin }) {
  const { theme, themePreference, setThemePreference } = useTheme();
  const { user, logout } = useAuth();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Icon name="back" size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Theme Preference Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Theme & Appearance</Text>
        <View style={styles.themeOptionsRow}>
          {[
            { id: 'dark', label: 'Dark Mode', icon: 'moon' },
            { id: 'light', label: 'Light Mode', icon: 'sun' },
            { id: 'system', label: 'System Mode', icon: 'sparkles' }
          ].map(t => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.themeCard,
                {
                  backgroundColor: themePreference === t.id ? 'rgba(99, 102, 241, 0.15)' : theme.colors.surfaceElevated,
                  borderColor: themePreference === t.id ? theme.colors.primary : theme.colors.border
                }
              ]}
              onPress={() => setThemePreference(t.id)}
            >
              <Icon name={t.icon} size={20} color={themePreference === t.id ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={[styles.themeLabel, { color: themePreference === t.id ? theme.colors.primary : theme.colors.textPrimary }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Privacy & Safety */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Privacy & Permissions</Text>
        <View style={[styles.cardGroup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Account Privacy</Text>
            <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
              {user?.isPrivate ? 'Private' : 'Public'}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Comments</Text>
            <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>Everyone</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>Active Status</Text>
            <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>Visible</Text>
          </View>
        </View>
      </View>

      {/* Admin Panel Access (for admin users) */}
      {user?.role === 'admin' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Platform Administration</Text>
          <TouchableOpacity
            style={[styles.adminBtn, { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: theme.colors.primary }]}
            onPress={onOpenAdmin}
          >
            <Icon name="shield" size={20} color={theme.colors.primary} />
            <Text style={[styles.adminBtnText, { color: theme.colors.primary }]}>
              Open Admin & Moderation Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: theme.colors.danger }]}
          onPress={logout}
        >
          <Text style={[styles.logoutText, { color: theme.colors.danger }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: theme.colors.textTertiary }]}>
          Connectly v1.0.0 • Ambient Social Network
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  backBtn: {
    padding: 4
  },
  title: {
    fontSize: 18,
    fontWeight: '800'
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 10
  },
  themeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6
  },
  themeLabel: {
    fontSize: 11,
    fontWeight: '700'
  },
  cardGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden'
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500'
  },
  settingValue: {
    fontSize: 13
  },
  divider: {
    height: 1
  },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1
  },
  adminBtnText: {
    fontSize: 14,
    fontWeight: '700'
  },
  logoutBtn: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700'
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center'
  }
});
