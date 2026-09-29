const { v4: uuidv4 } = require('uuid');
const { query } = require('../database');
const { emitToUser } = require('../sockets/socketHandler');

async function createNotification({ recipientId, actorId, type, referenceId = null, referenceType = null, message }) {
  if (recipientId === actorId) return null; // Don't notify self

  try {
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    await query(
      `INSERT INTO notifications (id, recipient_id, actor_id, type, reference_id, reference_type, message, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, recipientId, actorId, type, referenceId, referenceType, message, false, createdAt]
    );

    // Get actor info for immediate UI rendering
    const actorRes = await query('SELECT username FROM users WHERE id = $1', [actorId]);
    const profileRes = await query('SELECT display_name, avatar_url FROM profiles WHERE user_id = $1', [actorId]);
    
    const notificationPayload = {
      id,
      recipientId,
      actorId,
      actorUsername: actorRes.rows[0]?.username,
      actorDisplayName: profileRes.rows[0]?.display_name,
      actorAvatar: profileRes.rows[0]?.avatar_url,
      type,
      referenceId,
      referenceType,
      message,
      isRead: false,
      createdAt
    };

    // Real-time notification push to recipient socket
    emitToUser(recipientId, 'notification:new', notificationPayload);

    return notificationPayload;
  } catch (err) {
    console.error('[Notification Dispatch Error]', err);
    return null;
  }
}

module.exports = {
  createNotification
};
