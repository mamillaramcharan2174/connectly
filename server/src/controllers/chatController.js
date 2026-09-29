const { v4: uuidv4 } = require('uuid');
const { query } = require('../database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { emitToUser, emitToConversation, isUserOnline } = require('../sockets/socketHandler');
const { createNotification } = require('../services/notificationService');

// Get All Conversations for Current User
async function getConversations(req, res) {
  try {
    const userId = req.user.id;

    // Fetch conversation memberships
    const memRes = await query(
      `SELECT c.id, c.is_group, c.group_name, c.group_avatar, c.last_message_text, c.last_message_at, c.created_at,
              cm.role, cm.last_read_at, cm.is_muted
       FROM conversation_members cm
       JOIN conversations c ON c.id = cm.conversation_id
       WHERE cm.user_id = $1
       ORDER BY c.last_message_at DESC`,
      [userId]
    );

    const conversations = [];

    for (const conv of memRes.rows) {
      if (conv.is_group) {
        // Group conversation
        // Count unread
        const unreadCount = 0; // calculated from last_read_at vs messages
        conversations.push({
          id: conv.id,
          isGroup: true,
          name: conv.group_name,
          avatar: conv.group_avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80',
          lastMessage: conv.last_message_text || 'Group created',
          timestamp: conv.last_message_at || conv.created_at,
          unreadCount,
          isMuted: conv.is_muted,
          role: conv.role
        });
      } else {
        // Direct 1-on-1: find the other participant
        const otherMemberRes = await query(
          `SELECT cm.user_id, u.username, pr.display_name, pr.avatar_url, pr.is_online, pr.last_seen_at
           FROM conversation_members cm
           JOIN users u ON u.id = cm.user_id
           JOIN profiles pr ON pr.user_id = u.id
           WHERE cm.conversation_id = $1 AND cm.user_id != $2`,
          [conv.id, userId]
        );

        if (otherMemberRes.rows.length > 0) {
          const partner = otherMemberRes.rows[0];
          const onlineNow = isUserOnline(partner.user_id) || partner.is_online;

          conversations.push({
            id: conv.id,
            isGroup: false,
            partnerId: partner.user_id,
            username: partner.username,
            name: partner.display_name,
            avatar: partner.avatar_url,
            lastMessage: conv.last_message_text || 'Started a conversation',
            timestamp: conv.last_message_at || conv.created_at,
            unreadCount: 0,
            isOnline: Boolean(onlineNow),
            lastSeenAt: partner.last_seen_at,
            isMuted: conv.is_muted
          });
        }
      }
    }

    return successResponse(res, { conversations });
  } catch (err) {
    console.error('[GetConversations Error]', err);
    return errorResponse(res, 'CONVERSATIONS_FAILED', 'Could not load conversation list.', 500);
  }
}

// Start or Get Existing Direct Conversation
async function getOrCreateDirectConversation(req, res) {
  try {
    const currentUserId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) return errorResponse(res, 'TARGET_REQUIRED', 'targetUserId is required.');
    if (currentUserId === targetUserId) return errorResponse(res, 'SELF_CHAT', 'Cannot start conversation with yourself.');

    // Check if DM conversation already exists between these 2 users
    const existingRes = await query(
      `SELECT c.id
       FROM conversations c
       JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
       JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = $2
       WHERE c.is_group = FALSE`,
      [currentUserId, targetUserId]
    );

    if (existingRes.rows.length > 0) {
      return successResponse(res, { conversationId: existingRes.rows[0].id });
    }

    // Create new conversation
    const convId = uuidv4();
    const now = new Date().toISOString();

    await query(
      `INSERT INTO conversations (id, is_group, created_by, last_message_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [convId, false, currentUserId, now, now, now]
    );

    await query(
      `INSERT INTO conversation_members (id, conversation_id, user_id, role)
       VALUES ($1, $2, $3, 'member')`,
      [uuidv4(), convId, currentUserId]
    );
    await query(
      `INSERT INTO conversation_members (id, conversation_id, user_id, role)
       VALUES ($1, $2, $3, 'member')`,
      [uuidv4(), convId, targetUserId]
    );

    return successResponse(res, { conversationId: convId }, 201, 'Conversation created.');
  } catch (err) {
    console.error('[CreateDirectConv Error]', err);
    return errorResponse(res, 'CONV_CREATE_FAILED', 'Could not create conversation.', 500);
  }
}

// Create Group Conversation
async function createGroupConversation(req, res) {
  try {
    const currentUserId = req.user.id;
    const { name, avatarUrl = '', memberIds = [] } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, 'NAME_REQUIRED', 'Group name is required.');
    }

    const convId = uuidv4();
    const now = new Date().toISOString();

    await query(
      `INSERT INTO conversations (id, is_group, group_name, group_avatar, created_by, last_message_text, last_message_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [convId, true, name.trim(), avatarUrl, currentUserId, 'Group created', now, now, now]
    );

    // Creator is admin
    await query(
      `INSERT INTO conversation_members (id, conversation_id, user_id, role)
       VALUES ($1, $2, $3, 'admin')`,
      [uuidv4(), convId, currentUserId]
    );

    // Add members
    const allMembers = Array.from(new Set(memberIds)).filter(id => id !== currentUserId);
    for (const mId of allMembers) {
      await query(
        `INSERT INTO conversation_members (id, conversation_id, user_id, role)
         VALUES ($1, $2, $3, 'member')`,
        [uuidv4(), convId, mId]
      );

      await createNotification({
        recipientId: mId,
        actorId: currentUserId,
        type: 'group_invite',
        referenceId: convId,
        referenceType: 'conversation',
        message: `${req.user.username} added you to group "${name.trim()}".`
      });
    }

    return successResponse(res, { conversationId: convId, name, isGroup: true }, 201, 'Group created successfully.');
  } catch (err) {
    console.error('[CreateGroup Error]', err);
    return errorResponse(res, 'GROUP_CREATE_FAILED', 'Could not create group.', 500);
  }
}

// Get Messages in Conversation
async function getMessages(req, res) {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user.id;

    // Verify membership
    const memberCheck = await query(
      'SELECT id FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    if (memberCheck.rows.length === 0 && req.user.role !== 'admin') {
      return errorResponse(res, 'FORBIDDEN', 'You are not a member of this conversation.', 403);
    }

    const messagesRes = await query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.message_type, m.content, m.media_url,
              m.voice_duration, m.voice_waveform, m.metadata, m.reply_to_id, m.status, m.created_at,
              u.username, pr.display_name, pr.avatar_url
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       JOIN profiles pr ON pr.user_id = u.id
       WHERE m.conversation_id = $1 AND m.is_deleted = FALSE
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    // Fetch reactions for each message
    const messages = [];
    for (const m of messagesRes.rows) {
      const reactionsRes = await query(
        `SELECT mr.emoji, mr.user_id, u.username
         FROM message_reactions mr
         JOIN users u ON u.id = mr.user_id
         WHERE mr.message_id = $1`,
        [m.id]
      );

      messages.push({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        senderUsername: m.username,
        senderDisplayName: m.display_name,
        senderAvatar: m.avatar_url,
        isOwn: m.sender_id === userId,
        type: m.message_type,
        content: m.content,
        mediaUrl: m.media_url,
        voiceDuration: m.voice_duration,
        voiceWaveform: m.voice_waveform ? JSON.parse(m.voice_waveform) : null,
        metadata: m.metadata ? (typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata) : {},
        replyToId: m.reply_to_id,
        status: m.status,
        reactions: reactionsRes.rows,
        createdAt: m.created_at
      });
    }

    // Mark messages as read for this user
    await query(
      'UPDATE conversation_members SET last_read_at = $1 WHERE conversation_id = $2 AND user_id = $3',
      [new Date().toISOString(), conversationId, userId]
    );

    return successResponse(res, { messages });
  } catch (err) {
    console.error('[GetMessages Error]', err);
    return errorResponse(res, 'MESSAGES_FAILED', 'Could not load messages.', 500);
  }
}

// Send Message (Text, Image, Video, Voice note, Post share, Story reply)
async function sendMessage(req, res) {
  try {
    const { id: conversationId } = req.params;
    const senderId = req.user.id;
    const {
      type = 'text',
      content = '',
      mediaUrl = '',
      voiceDuration = 0,
      voiceWaveform = null,
      replyToId = null,
      metadata = {}
    } = req.body;

    // Verify member
    const memberCheck = await query(
      'SELECT id FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, senderId]
    );
    if (memberCheck.rows.length === 0) {
      return errorResponse(res, 'FORBIDDEN', 'You cannot send messages to this conversation.', 403);
    }

    const messageId = uuidv4();
    const now = new Date().toISOString();
    const waveformStr = voiceWaveform ? JSON.stringify(voiceWaveform) : '';

    // Insert message
    await query(
      `INSERT INTO messages (id, conversation_id, sender_id, message_type, content, media_url, voice_duration, voice_waveform, metadata, reply_to_id, status, is_deleted, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        messageId,
        conversationId,
        senderId,
        type,
        content,
        mediaUrl,
        voiceDuration,
        waveformStr,
        JSON.stringify(metadata),
        replyToId,
        'sent',
        false,
        now
      ]
    );

    // Update conversation last message preview
    const previewText = type === 'text' ? content : type === 'voice' ? '🎤 Voice message' : type === 'image' ? '📷 Photo' : type === 'video' ? '📹 Video' : 'Shared item';
    await query(
      'UPDATE conversations SET last_message_text = $1, last_message_at = $2, updated_at = $2 WHERE id = $3',
      [previewText, now, conversationId]
    );

    const senderProfile = await query('SELECT display_name, avatar_url FROM profiles WHERE user_id = $1', [senderId]);

    const messagePayload = {
      id: messageId,
      conversationId,
      senderId,
      senderUsername: req.user.username,
      senderDisplayName: senderProfile.rows[0]?.display_name,
      senderAvatar: senderProfile.rows[0]?.avatar_url,
      type,
      content,
      mediaUrl,
      voiceDuration,
      voiceWaveform,
      metadata,
      replyToId,
      status: 'sent',
      reactions: [],
      createdAt: now
    };

    // Emit real-time WebSocket event to all members in conversation room
    emitToConversation(conversationId, 'message:new', messagePayload);

    // Notify other members
    const otherMembers = await query(
      'SELECT user_id FROM conversation_members WHERE conversation_id = $1 AND user_id != $2',
      [conversationId, senderId]
    );
    for (const m of otherMembers.rows) {
      await createNotification({
        recipientId: m.user_id,
        actorId: senderId,
        type: 'new_message',
        referenceId: conversationId,
        referenceType: 'conversation',
        message: `${req.user.username}: ${previewText}`
      });
    }

    return successResponse(res, messagePayload, 201, 'Message sent.');
  } catch (err) {
    console.error('[SendMessage Error]', err);
    return errorResponse(res, 'SEND_FAILED', 'Could not send message.', 500);
  }
}

// React to Message
async function reactToMessage(req, res) {
  try {
    const { id: messageId } = req.params;
    const userId = req.user.id;
    const { emoji } = req.body;

    if (!emoji) return errorResponse(res, 'EMOJI_REQUIRED', 'Emoji is required.');

    const msgRes = await query('SELECT conversation_id FROM messages WHERE id = $1', [messageId]);
    if (msgRes.rows.length === 0) return errorResponse(res, 'NOT_FOUND', 'Message not found.', 404);

    const convId = msgRes.rows[0].conversation_id;

    await query(
      `INSERT INTO message_reactions (id, message_id, user_id, emoji)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
      [uuidv4(), messageId, userId, emoji]
    );

    // Emit real-time event
    emitToConversation(convId, 'message:reaction', {
      messageId,
      conversationId: convId,
      userId,
      username: req.user.username,
      emoji
    });

    return successResponse(res, { reacted: true, emoji });
  } catch (err) {
    return errorResponse(res, 'REACT_FAILED', 'Could not react to message.', 500);
  }
}

// Delete Message
async function deleteMessage(req, res) {
  try {
    const { id: messageId } = req.params;
    const userId = req.user.id;

    const msgRes = await query('SELECT sender_id, conversation_id FROM messages WHERE id = $1', [messageId]);
    if (msgRes.rows.length === 0) return errorResponse(res, 'NOT_FOUND', 'Message not found.', 404);

    if (msgRes.rows[0].sender_id !== userId && req.user.role !== 'admin') {
      return errorResponse(res, 'FORBIDDEN', 'You can only delete your own messages.', 403);
    }

    await query('UPDATE messages SET is_deleted = TRUE WHERE id = $1', [messageId]);

    emitToConversation(msgRes.rows[0].conversation_id, 'message:deleted', {
      messageId,
      conversationId: msgRes.rows[0].conversation_id
    });

    return successResponse(res, { deleted: true }, 200, 'Message deleted.');
  } catch (err) {
    return errorResponse(res, 'DELETE_FAILED', 'Could not delete message.', 500);
  }
}

module.exports = {
  getConversations,
  getOrCreateDirectConversation,
  createGroupConversation,
  getMessages,
  sendMessage,
  reactToMessage,
  deleteMessage
};
