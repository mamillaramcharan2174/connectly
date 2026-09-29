import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import Icon from '../icons/Icon';

export default function CommentsModal({ visible, post, onClose }) {
  const { theme } = useTheme();
  const [comments, setComments] = useState([]);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    if (visible && post) {
      loadComments();
    }
  }, [visible, post]);

  const loadComments = async () => {
    try {
      const res = await api.getComments(post.id);
      if (res.success && res.data) {
        setComments(res.data.comments || []);
      }
    } catch (_) {}
  };

  const handleSend = async () => {
    if (!inputText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.addComment(post.id, inputText.trim(), replyTo?.id || null);
      if (res.success && res.data) {
        setComments(prev => [...prev, res.data]);
        setInputText('');
        setReplyTo(null);
      }
    } catch (_) {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheetContainer, { backgroundColor: theme.colors.surfaceElevated }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.dragPill} />
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Comments</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments List */}
          <FlatList
            data={comments}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  No comments yet. Start the conversation!
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Image
                  source={{ uri: item.avatar_url || item.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' }}
                  style={styles.avatar}
                />
                <View style={styles.commentBody}>
                  <Text style={[styles.commentAuthor, { color: theme.colors.textPrimary }]}>
                    {item.username || 'user'}
                  </Text>
                  <Text style={[styles.commentText, { color: theme.colors.textSecondary }]}>
                    {item.content}
                  </Text>
                  <View style={styles.commentFooter}>
                    <TouchableOpacity onPress={() => setReplyTo(item)}>
                      <Text style={[styles.replyAction, { color: theme.colors.textTertiary }]}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />

          {/* Reply Context Bar */}
          {replyTo && (
            <View style={[styles.replyingBar, { backgroundColor: theme.colors.surfaceHighlight }]}>
              <Text style={[styles.replyingText, { color: theme.colors.textSecondary }]}>
                Replying to <Text style={{ fontWeight: '700' }}>@{replyTo.username}</Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Icon name="close" size={16} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Bar */}
          <View style={[styles.inputBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary, backgroundColor: theme.colors.surfaceElevated }]}
              placeholder={replyTo ? `Reply to @${replyTo.username}...` : 'Add a thoughtful comment...'}
              placeholderTextColor={theme.colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim() ? theme.colors.primary : 'transparent' }
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || submitting}
            >
              <Icon
                name="send"
                size={18}
                color={inputText.trim() ? '#FFFFFF' : theme.colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden'
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1
  },
  dragPill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(156, 163, 175, 0.4)',
    marginBottom: 8
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: '700'
  },
  closeBtn: {
    padding: 4
  },
  listContent: {
    padding: 16
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    backgroundColor: '#374151'
  },
  commentBody: {
    flex: 1
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  replyAction: {
    fontSize: 11,
    fontWeight: '600'
  },
  replyingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  replyingText: {
    fontSize: 12
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    fontSize: 13
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 14
  }
});
