import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Modal, FlatList } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import Icon from '../../icons/Icon';

const SAMPLE_USERS = [
  { id: 'u-1-elena', username: 'elena_v', name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' },
  { id: 'u-2-marcus', username: 'marcus_dev', name: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d' },
  { id: 'u-3-sophia', username: 'sophia_art', name: 'Sophia Miller', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' },
  { id: 'u-5-maya', username: 'maya_wanderer', name: 'Maya Tanaka', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9' },
  { id: 'u-8-kenji', username: 'kenji_design', name: 'Kenji Sato', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d' }
];

export default function GroupCreateModal({ visible, onClose, onCreated }) {
  const { theme } = useTheme();
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedUserIds(prev => [...prev, id]);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUserIds.length === 0 || loading) return;
    setLoading(true);
    try {
      const res = await api.createGroupConversation(
        groupName.trim(),
        selectedUserIds,
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80'
      );
      if (res.success && res.data) {
        onCreated && onCreated(res.data.conversationId);
      }
    } catch (err) {
      console.warn('Create group error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>New Group Chat</Text>
            <TouchableOpacity onPress={handleCreate} disabled={!groupName.trim() || selectedUserIds.length === 0 || loading}>
              <Text
                style={[
                  styles.createBtnText,
                  { color: groupName.trim() && selectedUserIds.length > 0 ? theme.colors.primary : theme.colors.textTertiary }
                ]}
              >
                Create
              </Text>
            </TouchableOpacity>
          </View>

          {/* Group Name Field */}
          <TextInput
            style={[styles.nameInput, { color: theme.colors.textPrimary, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            placeholder="Group Name..."
            placeholderTextColor={theme.colors.textTertiary}
            value={groupName}
            onChangeText={setGroupName}
          />

          <Text style={[styles.membersHeading, { color: theme.colors.textSecondary }]}>
            Add Members ({selectedUserIds.length} selected)
          </Text>

          {/* Members List */}
          <FlatList
            data={SAMPLE_USERS}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = selectedUserIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={[
                    styles.memberRow,
                    {
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                      borderColor: theme.colors.border
                    }
                  ]}
                  onPress={() => toggleSelect(item.id)}
                >
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: theme.colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.username, { color: theme.colors.textSecondary }]}>@{item.username}</Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border
                      }
                    ]}
                  >
                    {isSelected && <Icon name="check" size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 17,
    fontWeight: '700'
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '700'
  },
  nameInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 16
  },
  membersHeading: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10
  },
  listContent: {
    paddingBottom: 10
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  info: {
    flex: 1
  },
  name: {
    fontSize: 13.5,
    fontWeight: '600'
  },
  username: {
    fontSize: 11.5
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
