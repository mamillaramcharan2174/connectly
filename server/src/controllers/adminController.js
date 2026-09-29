const { query } = require('../database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// Admin Analytics Overview
async function getAdminOverview(req, res) {
  try {
    const totalUsers = await query('SELECT id FROM users');
    const totalPosts = await query('SELECT id FROM posts WHERE is_deleted = FALSE');
    const totalStories = await query('SELECT id FROM stories WHERE is_deleted = FALSE');
    const pendingReports = await query("SELECT id FROM reports WHERE status = 'pending'");
    const suspendedUsers = await query('SELECT id FROM users WHERE is_suspended = TRUE');

    return successResponse(res, {
      totalUsers: totalUsers.rows.length,
      totalPosts: totalPosts.rows.length,
      totalStories: totalStories.rows.length,
      pendingReports: pendingReports.rows.length,
      suspendedUsers: suspendedUsers.rows.length,
      serverUptimeSeconds: Math.floor(process.uptime()),
      systemStatus: 'healthy'
    });
  } catch (err) {
    return errorResponse(res, 'OVERVIEW_FAILED', 'Could not load admin stats.', 500);
  }
}

// User Management: List Users
async function listUsers(req, res) {
  try {
    const usersRes = await query(
      `SELECT u.id, u.username, u.email, u.role, u.is_private, u.is_suspended, u.created_at,
              p.display_name, p.avatar_url, p.followers_count, p.posts_count
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       ORDER BY u.created_at DESC
       LIMIT 50`
    );

    return successResponse(res, { users: usersRes.rows });
  } catch (err) {
    return errorResponse(res, 'LIST_USERS_FAILED', 'Could not retrieve users list.', 500);
  }
}

// Suspend / Restore Account
async function toggleUserSuspension(req, res) {
  try {
    const { id } = req.params;
    const { suspend, reason = 'Violation of community guidelines' } = req.body;

    const userRes = await query('SELECT id, username, role FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) return errorResponse(res, 'NOT_FOUND', 'User not found.', 404);
    if (userRes.rows[0].role === 'admin') {
      return errorResponse(res, 'CANNOT_SUSPEND_ADMIN', 'Administrator accounts cannot be suspended.', 400);
    }

    await query(
      'UPDATE users SET is_suspended = $1, updated_at = $2 WHERE id = $3',
      [Boolean(suspend), new Date().toISOString(), id]
    );

    // If suspending, invalidate all user sessions
    if (suspend) {
      await query('UPDATE sessions SET is_revoked = TRUE WHERE user_id = $1', [id]);
    }

    return successResponse(res, {
      userId: id,
      isSuspended: Boolean(suspend),
      reason
    }, 200, `User account ${suspend ? 'suspended' : 'restored'} successfully.`);
  } catch (err) {
    return errorResponse(res, 'SUSPENSION_FAILED', 'Could not update user suspension state.', 500);
  }
}

// Moderation Queue: Reports List
async function getReportsQueue(req, res) {
  try {
    const status = req.query.status || 'pending';
    const reportsRes = await query(
      `SELECT r.id, r.reporter_id, r.target_type, r.target_id, r.reason, r.description, r.status, r.created_at,
              u.username as reporter_username
       FROM reports r
       JOIN users u ON u.id = r.reporter_id
       WHERE r.status = $1
       ORDER BY r.created_at DESC`,
      [status]
    );

    return successResponse(res, { reports: reportsRes.rows });
  } catch (err) {
    return errorResponse(res, 'REPORTS_QUEUE_FAILED', 'Could not fetch reports.', 500);
  }
}

// Resolve Moderation Report
async function resolveReport(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { status = 'resolved', resolutionNotes = '', actionTaken = 'none' } = req.body;

    const reportRes = await query('SELECT id, target_type, target_id FROM reports WHERE id = $1', [id]);
    if (reportRes.rows.length === 0) return errorResponse(res, 'NOT_FOUND', 'Report not found.', 404);

    const report = reportRes.rows[0];

    // If action is remove_content
    if (actionTaken === 'remove_content') {
      if (report.target_type === 'post') {
        await query('UPDATE posts SET is_deleted = TRUE WHERE id = $1', [report.target_id]);
      } else if (report.target_type === 'story') {
        await query('UPDATE stories SET is_deleted = TRUE WHERE id = $1', [report.target_id]);
      } else if (report.target_type === 'comment') {
        await query('UPDATE comments SET is_deleted = TRUE WHERE id = $1', [report.target_id]);
      }
    }

    await query(
      `UPDATE reports 
       SET status = $1, resolved_by = $2, resolution_notes = $3, updated_at = $4
       WHERE id = $5`,
      [status, adminId, resolutionNotes, new Date().toISOString(), id]
    );

    return successResponse(res, { reportId: id, status, actionTaken }, 200, 'Report updated.');
  } catch (err) {
    return errorResponse(res, 'RESOLVE_FAILED', 'Could not update report.', 500);
  }
}

module.exports = {
  getAdminOverview,
  listUsers,
  toggleUserSuspension,
  getReportsQueue,
  resolveReport
};
