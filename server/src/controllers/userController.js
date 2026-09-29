const { v4: uuidv4 } = require('uuid');
const { query } = require('../database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { createNotification } = require('../services/notificationService');

async function getProfileByUsername(req, res) {
  try {
    const { username } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const userRes = await query(
      `SELECT u.id, u.username, u.email, u.role, u.is_private, u.is_suspended,
              p.display_name, p.bio, p.website, p.avatar_url, p.cover_url,
              p.followers_count, p.following_count, p.posts_count, p.is_online, p.last_seen_at
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.username = $1`,
      [username.toLowerCase().trim()]
    );

    if (userRes.rows.length === 0) {
      return errorResponse(res, 'USER_NOT_FOUND', 'User does not exist.', 404);
    }

    const targetUser = userRes.rows[0];

    // Check if blocked
    let isBlocked = false;
    let isFollowing = false;
    let isFollowPending = false;
    let isMuted = false;

    if (currentUserId && currentUserId !== targetUser.id) {
      const blockRes = await query(
        'SELECT id FROM blocked_users WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)',
        [currentUserId, targetUser.id]
      );
      if (blockRes.rows.length > 0) {
        return errorResponse(res, 'USER_BLOCKED', 'This profile is unavailable.', 404);
      }

      const followRes = await query(
        'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
        [currentUserId, targetUser.id]
      );
      isFollowing = followRes.rows.length > 0;

      const requestRes = await query(
        "SELECT id FROM follow_requests WHERE requester_id = $1 AND target_id = $2 AND status = 'pending'",
        [currentUserId, targetUser.id]
      );
      isFollowPending = requestRes.rows.length > 0;

      const muteRes = await query(
        'SELECT id FROM muted_users WHERE muter_id = $1 AND muted_id = $2',
        [currentUserId, targetUser.id]
      );
      isMuted = muteRes.rows.length > 0;
    }

    // Determine post access based on privacy
    const isOwner = currentUserId === targetUser.id;
    const canViewPosts = isOwner || !targetUser.is_private || isFollowing;

    let userPosts = [];
    if (canViewPosts) {
      const postsRes = await query(
        `SELECT p.id, p.caption, p.location, p.likes_count, p.comments_count, p.created_at,
                (SELECT media_url FROM post_media WHERE post_id = p.id ORDER BY order_index ASC LIMIT 1) as thumbnail_url
         FROM posts p
         WHERE p.user_id = $1 AND p.is_deleted = FALSE AND p.is_archived = FALSE
         ORDER BY p.created_at DESC`,
        [targetUser.id]
      );
      userPosts = postsRes.rows;
    }

    return successResponse(res, {
      user: {
        id: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.display_name,
        bio: targetUser.bio,
        website: targetUser.website,
        avatarUrl: targetUser.avatar_url,
        coverUrl: targetUser.cover_url,
        isPrivate: targetUser.is_private,
        followersCount: targetUser.followers_count || 0,
        followingCount: targetUser.following_count || 0,
        postsCount: targetUser.posts_count || 0,
        isOnline: targetUser.is_online,
        lastSeenAt: targetUser.last_seen_at,
        isFollowing,
        isFollowPending,
        isMuted,
        isOwner,
        canViewPosts
      },
      posts: userPosts
    });
  } catch (err) {
    console.error('[GetProfile Error]', err);
    return errorResponse(res, 'SERVER_ERROR', 'Could not load profile.', 500);
  }
}

async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { displayName, bio, website, avatarUrl, coverUrl, themePreference, isPrivate, notificationPreferences, privacySettings } = req.body;

    const updates = [];
    const params = [];
    let pIdx = 1;

    // Profile updates
    if (displayName !== undefined) { updates.push(`display_name = $${pIdx++}`); params.push(displayName); }
    if (bio !== undefined) { updates.push(`bio = $${pIdx++}`); params.push(bio); }
    if (website !== undefined) { updates.push(`website = $${pIdx++}`); params.push(website); }
    if (avatarUrl !== undefined) { updates.push(`avatar_url = $${pIdx++}`); params.push(avatarUrl); }
    if (coverUrl !== undefined) { updates.push(`cover_url = $${pIdx++}`); params.push(coverUrl); }
    if (themePreference !== undefined) { updates.push(`theme_preference = $${pIdx++}`); params.push(themePreference); }
    if (notificationPreferences !== undefined) { updates.push(`notification_preferences = $${pIdx++}`); params.push(JSON.stringify(notificationPreferences)); }
    if (privacySettings !== undefined) { updates.push(`privacy_settings = $${pIdx++}`); params.push(JSON.stringify(privacySettings)); }

    if (updates.length > 0) {
      updates.push(`updated_at = $${pIdx++}`);
      params.push(new Date().toISOString());
      params.push(userId);
      await query(`UPDATE profiles SET ${updates.join(', ')} WHERE user_id = $${pIdx}`, params);
    }

    if (isPrivate !== undefined) {
      await query('UPDATE users SET is_private = $1, updated_at = $2 WHERE id = $3', [Boolean(isPrivate), new Date().toISOString(), userId]);
    }

    return successResponse(res, { updated: true }, 200, 'Profile updated successfully.');
  } catch (err) {
    console.error('[UpdateProfile Error]', err);
    return errorResponse(res, 'UPDATE_FAILED', 'Could not update profile.', 500);
  }
}

async function followUser(req, res) {
  try {
    const followerId = req.user.id;
    const targetUserId = req.params.id;

    if (followerId === targetUserId) {
      return errorResponse(res, 'SELF_FOLLOW', 'You cannot follow yourself.', 400);
    }

    // Check target exists
    const targetRes = await query('SELECT id, is_private, username FROM users WHERE id = $1', [targetUserId]);
    if (targetRes.rows.length === 0) {
      return errorResponse(res, 'USER_NOT_FOUND', 'Target user not found.', 404);
    }

    const targetUser = targetRes.rows[0];

    // Check if target is private
    if (targetUser.is_private) {
      // Create or update follow request
      await query(
        `INSERT INTO follow_requests (id, requester_id, target_id, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (requester_id, target_id) DO UPDATE SET status = 'pending'`,
        [uuidv4(), followerId, targetUserId, 'pending']
      );

      await createNotification({
        recipientId: targetUserId,
        actorId: followerId,
        type: 'follow_request',
        referenceId: followerId,
        referenceType: 'user',
        message: `${req.user.username} requested to follow you.`
      });

      return successResponse(res, { status: 'requested', isFollowing: false }, 200, 'Follow request sent.');
    }

    // Public profile -> direct follow
    await query(
      `INSERT INTO follows (id, follower_id, following_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [uuidv4(), followerId, targetUserId]
    );

    // Update counters
    await query('UPDATE profiles SET following_count = following_count + 1 WHERE user_id = $1', [followerId]);
    await query('UPDATE profiles SET followers_count = followers_count + 1 WHERE user_id = $1', [targetUserId]);

    await createNotification({
      recipientId: targetUserId,
      actorId: followerId,
      type: 'follow',
      referenceId: followerId,
      referenceType: 'user',
      message: `${req.user.username} started following you.`
    });

    return successResponse(res, { status: 'following', isFollowing: true }, 200, 'Followed successfully.');
  } catch (err) {
    console.error('[Follow Error]', err);
    return errorResponse(res, 'FOLLOW_FAILED', 'Could not follow user.', 500);
  }
}

async function unfollowUser(req, res) {
  try {
    const followerId = req.user.id;
    const targetUserId = req.params.id;

    // Delete follow
    const delRes = await query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2 RETURNING id',
      [followerId, targetUserId]
    );

    // Also delete any pending follow request
    await query('DELETE FROM follow_requests WHERE requester_id = $1 AND target_id = $2', [followerId, targetUserId]);

    if (delRes.rowCount > 0 || (delRes.rows && delRes.rows.length > 0)) {
      await query('UPDATE profiles SET following_count = following_count - 1 WHERE user_id = $1', [followerId]);
      await query('UPDATE profiles SET followers_count = followers_count - 1 WHERE user_id = $1', [targetUserId]);
    }

    return successResponse(res, { status: 'none', isFollowing: false }, 200, 'Unfollowed successfully.');
  } catch (err) {
    console.error('[Unfollow Error]', err);
    return errorResponse(res, 'UNFOLLOW_FAILED', 'Could not unfollow user.', 500);
  }
}

async function blockUser(req, res) {
  try {
    const blockerId = req.user.id;
    const targetUserId = req.params.id;

    if (blockerId === targetUserId) {
      return errorResponse(res, 'INVALID_ACTION', 'You cannot block yourself.', 400);
    }

    await query(
      'INSERT INTO blocked_users (id, blocker_id, blocked_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [uuidv4(), blockerId, targetUserId]
    );

    // Remove mutual follows
    await query('DELETE FROM follows WHERE (follower_id = $1 AND following_id = $2) OR (follower_id = $2 AND following_id = $1)', [blockerId, targetUserId]);

    return successResponse(res, { blocked: true }, 200, 'User has been blocked.');
  } catch (err) {
    return errorResponse(res, 'BLOCK_FAILED', 'Could not block user.', 500);
  }
}

async function unblockUser(req, res) {
  try {
    const blockerId = req.user.id;
    const targetUserId = req.params.id;

    await query('DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2', [blockerId, targetUserId]);
    return successResponse(res, { blocked: false }, 200, 'User has been unblocked.');
  } catch (err) {
    return errorResponse(res, 'UNBLOCK_FAILED', 'Could not unblock user.', 500);
  }
}

async function muteUser(req, res) {
  try {
    const muterId = req.user.id;
    const targetUserId = req.params.id;

    await query(
      'INSERT INTO muted_users (id, muter_id, muted_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [uuidv4(), muterId, targetUserId]
    );
    return successResponse(res, { muted: true }, 200, 'User has been muted.');
  } catch (err) {
    return errorResponse(res, 'MUTE_FAILED', 'Could not mute user.', 500);
  }
}

async function searchUsers(req, res) {
  try {
    const q = req.query.q ? req.query.q.trim().toLowerCase() : '';
    if (!q) {
      return successResponse(res, { users: [] });
    }

    const currentUserId = req.user ? req.user.id : null;

    // Search users by username or display name
    const usersRes = await query(
      `SELECT u.id, u.username, u.is_private, p.display_name, p.avatar_url, p.bio, p.followers_count
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE (u.username ILIKE $1 OR p.display_name ILIKE $1) AND u.is_suspended = FALSE
       LIMIT 20`,
      [`%${q}%`]
    );

    return successResponse(res, { users: usersRes.rows });
  } catch (err) {
    console.error('[SearchUsers Error]', err);
    return errorResponse(res, 'SEARCH_FAILED', 'Search query failed.', 500);
  }
}

module.exports = {
  getProfileByUsername,
  updateProfile,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  muteUser,
  searchUsers
};
