import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import Icon from '../../icons/Icon';
import VoiceRecorder from '../../components/VoiceRecorder';
import WaveformPlayer from '../../components/WaveformPlayer';

export default function ChatScreen({ conversationId, partnerInfo, onBack, onOpenUserProfile }) {
  const { theme, isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const { activeTypingUsers } = useSocket();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      socketService.joinConversation(conversationId);

      // Listen for incoming messages in this conversation
      const handleIncomingMessage = (newMsg) => {
        if (newMsg.conversationId === conversationId) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Mark as read
          socketService.markRead(newMsg.id, conversationId);
        }
      };

      const handleReaction = ({ messageId, emoji, userId }) => {
        setMessages(prev => prev.map(m => {
          if (m.id === messageId) {
            const currentReactions = m.reactions || [];
            return {
              ...m,
              reactions: [...currentReactions.filter(r => r.userId !== userId), { emoji, userId }]
            };
          }
          return m;
        }));
      };

      socketService.on('message:new', handleIncomingMessage);
      socketService.on('message:reaction', handleReaction);

      return () => {
        socketService.leaveConversation(conversationId);
        socketService.off('message:new', handleIncomingMessage);
        socketService.off('message:reaction', handleReaction);
      };
    }
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      const res = await api.getMessages(conversationId);
      if (res.success && res.data) {
        setMessages(res.data.messages || []);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    socketService.sendTyping(conversationId, false);

    try {
      const res = await api.sendMessage(conversationId, {
        type: 'text',
        content: textToSend
      });
      if (res.success && res.data) {
        setMessages(prev => [...prev, { ...res.data, isOwn: true }]);
      }
    } catch (_) {}
  };

  const handleSendVoice = async ({ duration, waveform, mediaUrl }) => {
    try {
      const res = await api.sendMessage(conversationId, {
        type: 'voice',
        content: `Voice note (${duration}s)`,
        voiceDuration: duration,
        voiceWaveform: waveform,
        mediaUrl
      });
      if (res.success && res.data) {
        setMessages(prev => [...prev, { ...res.data, isOwn: true }]);
      }
    } catch (_) {}
  };

  const handleReact = async (messageId, emoji) => {
    setActiveReactionMsgId(null);
    try {
      await api.reactToMessage(messageId, emoji);
    } catch (_) {}
  };

  const handleDelete = async (messageId) => {
    try {
      await api.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (_) {}
  };

  const isPartnerTyping = activeTypingUsers[conversationId];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Icon name="back" size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfoRow}
          onPress={() => partnerInfo?.username && onOpenUserProfile && onOpenUserProfile(partnerInfo.username)}
        >
          <Image
            source={{ uri: partnerInfo?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' }}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={[styles.headerName, { color: theme.colors.textPrimary }]}>
              {partnerInfo?.name || partnerInfo?.username || 'Chat'}
            </Text>
            <Text style={[styles.headerStatus, { color: partnerInfo?.isOnline ? theme.colors.success : theme.colors.textTertiary }]}>
              {isPartnerTyping ? 'Typing...' : partnerInfo?.isOnline ? 'Active now' : 'Seen recently'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ width: 24 }} />
      </View>

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isOwn = item.isOwn || item.senderId === currentUser?.id;
          const showReactionsMenu = activeReactionMsgId === item.id;

          return (
            <View style={[styles.messageRow, isOwn ? styles.ownMessageRow : styles.otherMessageRow]}>
              {/* Message Bubble */}
              <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={() => setActiveReactionMsgId(showReactionsMenu ? null : item.id)}
                style={[
                  styles.bubble,
                  isOwn
                    ? [styles.ownBubble, { backgroundColor: theme.colors.bubbleSelf }]
                    : [styles.otherBubble, { backgroundColor: theme.colors.bubbleOther }]
                ]}
              >
                {/* Voice Note Message */}
                {item.type === 'voice' ? (
                  <WaveformPlayer
                    waveform={item.voiceWaveform}
                    duration={item.voiceDuration || 5}
                    isOwn={isOwn}
                  />
                ) : (
                  <Text style={[styles.messageText, { color: isOwn ? theme.colors.bubbleSelfText : theme.colors.bubbleOtherText }]}>
                    {item.content}
                  </Text>
                )}

                {/* Footer Time & Status */}
                <View style={styles.bubbleFooter}>
                  <Text style={[styles.timeText, { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.colors.textTertiary }]}>
                    12:45
                  </Text>
                  {isOwn && (
                    <Icon
                      name={item.status === 'read' ? 'double-check' : 'check'}
                      size={14}
                      color={item.status === 'read' ? '#06B6D4' : 'rgba(255,255,255,0.7)'}
                    />
                  )}
                </View>

                {/* Attached Reactions */}
                {item.reactions && item.reactions.length > 0 && (
                  <View style={[styles.reactionsBadge, { backgroundColor: theme.colors.surfaceElevated }]}>
                    {item.reactions.map((r, i) => (
                      <Text key={i} style={styles.reactionEmoji}>{r.emoji}</Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>

              {/* Quick Reactions Popup */}
              {showReactionsMenu && (
                <View style={[styles.reactionsBar, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                  {['❤️', '🔥', '👍', '😂', '😮', '😢'].map(emoji => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.reactionBtn}
                      onPress={() => handleReact(item.id, emoji)}
                    >
                      <Text style={{ fontSize: 18 }}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                  {isOwn && (
                    <TouchableOpacity
                      style={styles.reactionBtn}
                      onPress={() => handleDelete(item.id)}
                    >
                      <Icon name="trash" size={16} color={theme.colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Typing Status Indicator */}
      {isPartnerTyping && (
        <View style={styles.typingIndicator}>
          <Text style={[styles.typingText, { color: theme.colors.textSecondary }]}>
            {partnerInfo?.username || 'Partner'} is typing...
          </Text>
        </View>
      )}

      {/* Bottom Bar: Input + Voice Recorder */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.inputBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}
      >
        <TextInput
          style={[styles.input, { color: theme.colors.textPrimary, backgroundColor: theme.colors.surfaceElevated }]}
          placeholder="Message..."
          placeholderTextColor={theme.colors.textTertiary}
          value={inputText}
          onChangeText={text => {
            setInputText(text);
            socketService.sendTyping(conversationId, text.length > 0);
          }}
        />

        {inputText.trim() ? (
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSendText}>
            <Icon name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <VoiceRecorder onRecordingComplete={handleSendVoice} />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  backBtn: {
    paddingRight: 10
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700'
  },
  headerStatus: {
    fontSize: 11
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  messageRow: {
    marginBottom: 12,
    position: 'relative'
  },
  ownMessageRow: {
    alignItems: 'flex-end'
  },
  otherMessageRow: {
    alignItems: 'flex-start'
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    position: 'relative'
  },
  ownBubble: {
    borderBottomRightRadius: 4
  },
  otherBubble: {
    borderBottomLeftRadius: 4
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4
  },
  timeText: {
    fontSize: 10
  },
  reactionsBadge: {
    position: 'absolute',
    bottom: -8,
    right: 10,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  reactionEmoji: {
    fontSize: 12
  },
  reactionsBar: {
    position: 'absolute',
    top: -42,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 20,
    gap: 6
  },
  reactionBtn: {
    padding: 4
  },
  typingIndicator: {
    paddingHorizontal: 18,
    paddingVertical: 4
  },
  typingText: {
    fontSize: 11.5,
    fontStyle: 'italic'
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
    paddingHorizontal: 16,
    fontSize: 13.5,
    marginRight: 8
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
