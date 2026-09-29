const { query } = require('../database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

async function getNotifications(req, res) {
  try {
    const userId = req.user.id;

    const notifRes = await query(
      `SELECT n.id, n.recipient_id, n.actor_id, n.type, n.reference_id, n.reference_type, n.message, n.is_read, n.created_at,
              u.username as actor_username, pr.display_name as actor_display_name, pr.avatar_url as actor_avatar
       FROM notifications n
       JOIN users u ON u.id = n.actor_id
       JOIN profiles pr ON pr.user_id = u.id
       WHERE n.recipient_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    return successResponse(res, { notifications: notifRes.rows });
  } catch (err) {
    console.error('[GetNotifications Error]', err);
    return errorResponse(res, 'NOTIFICATIONS_FAILED', 'Could not load notifications.', 500);
  }
}

async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_id = $2', [id, userId]);
    return successResponse(res, { read: true });
  } catch (err) {
    return errorResponse(res, 'UPDATE_FAILED', 'Could not mark notification as read.', 500);
  }
}

async function markAllRead(req, res) {
  try {
    const userId = req.user.id;
    await query('UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1', [userId]);
    return successResponse(res, { allRead: true });
  } catch (err) {
    return errorResponse(res, 'UPDATE_FAILED', 'Could not mark all notifications as read.', 500);
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllRead
};
