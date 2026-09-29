import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Icon from '../../icons/Icon';

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
];

export default function EditProfileScreen({ onBack, onSaved }) {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || SAMPLE_AVATARS[0]);
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        website: website.trim(),
        avatarUrl,
        isPrivate
      };

      const res = await api.updateProfile(payload);
      if (res.success) {
        updateUser(payload);
        onSaved && onSaved();
        onBack && onBack();
      }
    } catch (err) {
      console.warn('Update profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.navBtn}>
          <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Edit Profile</Text>

        <TouchableOpacity onPress={handleSave} style={styles.navBtn} disabled={saving}>
          <Text style={[styles.saveText, { color: theme.colors.primary }]}>
            {saving ? 'Saving...' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Avatar Change Area */}
      <View style={styles.avatarSection}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <Text style={[styles.changePhotoText, { color: theme.colors.primary }]}>
          Choose Avatar Preset
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
          {SAMPLE_AVATARS.map((url, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setAvatarUrl(url)}
              style={[
                styles.presetThumb,
                avatarUrl === url && { borderColor: theme.colors.primary, borderWidth: 2.5 }
              ]}
            >
              <Image source={{ uri: url }} style={styles.thumbImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Fields */}
      <View style={[styles.form, { borderTopColor: theme.colors.border }]}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Name</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary, borderBottomColor: theme.colors.border }]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display Name"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Username</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.textTertiary, borderBottomColor: theme.colors.border }]}
            value={user?.username}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Bio</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary, borderBottomColor: theme.colors.border }]}
            value={bio}
            onChangeText={setBio}
            placeholder="A short bio about yourself..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Website</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary, borderBottomColor: theme.colors.border }]}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://yourwebsite.com"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="none"
          />
        </View>

        {/* Private Account Toggle */}
        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={[styles.switchTitle, { color: theme.colors.textPrimary }]}>Private Account</Text>
            <Text style={[styles.switchSubtitle, { color: theme.colors.textTertiary }]}>
              When your account is private, only followers you approve can see your photos and stories.
            </Text>
          </View>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>
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
  navBtn: {
    padding: 4
  },
  cancelText: {
    fontSize: 15
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700'
  },
  title: {
    fontSize: 17,
    fontWeight: '700'
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12
  },
  presetsRow: {
    gap: 10,
    paddingHorizontal: 16
  },
  presetThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden'
  },
  thumbImage: {
    width: '100%',
    height: '100%'
  },
  form: {
    paddingHorizontal: 16,
    borderTopWidth: 1,
    paddingTop: 8
  },
  inputGroup: {
    marginVertical: 8
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4
  },
  input: {
    fontSize: 14,
    paddingVertical: 8,
    borderBottomWidth: 1
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 16
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600'
  },
  switchSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16
  }
});
