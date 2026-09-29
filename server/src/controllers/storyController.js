const { v4: uuidv4 } = require('uuid');
const { query } = require('../database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { createNotification } = require('../services/notificationService');

// Get Active Stories Feed grouped by User (Tray)
async function getStoriesFeed(req, res) {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const now = new Date().toISOString();

    // Query active stories where expires_at > now and not deleted
    const storiesRes = await query(
      `SELECT s.id, s.user_id, s.caption, s.background_style, s.font_style, s.privacy, s.expires_at, s.created_at,
              u.username, pr.display_name, pr.avatar_url
       FROM stories s
       JOIN users u ON u.id = s.user_id
       JOIN profiles pr ON pr.user_id = u.id
       WHERE s.expires_at > $1 AND s.is_deleted = FALSE AND u.is_suspended = FALSE
       ORDER BY s.created_at ASC`,
      [now]
    );

    // Group stories by user
    const usersMap = new Map();

    for (const s of storiesRes.rows) {
      // Check if current user has viewed this story
      let isSeen = false;
      if (currentUserId) {
        const viewRes = await query('SELECT id FROM story_views WHERE story_id = $1 AND viewer_id = $2', [s.id, currentUserId]);
        isSeen = viewRes.rows.length > 0;
      }

      // Fetch story media
      const mediaRes = await query(
        'SELECT id, media_url, media_type, duration FROM story_media WHERE story_id = $1',
        [s.id]
      );

      const storyItem = {
        id: s.id,
        caption: s.caption,
        backgroundStyle: s.background_style,
        fontStyle: s.font_style,
        privacy: s.privacy,
        expiresAt: s.expires_at,
        createdAt: s.created_at,
        media: mediaRes.rows,
        isSeen
      };

      if (!usersMap.has(s.user_id)) {
        usersMap.set(s.user_id, {
          userId: s.user_id,
          username: s.username,
          displayName: s.display_name,
          avatarUrl: s.avatar_url,
          isCurrentUser: currentUserId === s.user_id,
          hasUnseen: !isSeen,
          stories: [storyItem]
        });
      } else {
        const group = usersMap.get(s.user_id);
        if (!isSeen) group.hasUnseen = true;
        group.stories.push(storyItem);
      }
    }

    // Convert map to array with current user's story first (if exists)
    let tray = Array.from(usersMap.values());
    tray.sort((a, b) => {
      if (a.isCurrentUser) return -1;
      if (b.isCurrentUser) return 1;
      if (a.hasUnseen && !b.hasUnseen) return -1;
      if (!a.hasUnseen && b.hasUnseen) return 1;
      return 0;
    });

    return successResponse(res, { storiesTray: tray });
  } catch (err) {
    console.error('[GetStoriesFeed Error]', err);
    return errorResponse(res, 'STORIES_FEED_FAILED', 'Could not load stories feed.', 500);
  }
}

// Create 24h Story
async function createStory(req, res) {
  try {
    const userId = req.user.id;
    const {
      caption = '',
      backgroundStyle = 'default',
      fontStyle = 'sans',
      privacy = 'everyone',
      media = []
    } = req.body;

    const storyId = uuidv4();
    const now = new Date();
    // Expiration: exactly 24 hours from creation
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    await query(
      `INSERT INTO stories (id, user_id, caption, background_style, font_style, privacy, views_count, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [storyId, userId, caption, backgroundStyle, fontStyle, privacy, 0, expiresAt, now.toISOString()]
    );

    // If media items provided
    if (Array.isArray(media) && media.length > 0) {
      for (const item of media) {
        await query(
          `INSERT INTO story_media (id, story_id, media_url, media_type, duration)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), storyId, item.url || item.mediaUrl, item.type || item.mediaType || 'image', item.duration || 5]
        );
      }
    } else {
      // Text-only story
      await query(
        `INSERT INTO story_media (id, story_id, media_url, media_type, duration)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), storyId, '', 'text', 5]
      );
    }

    return successResponse(res, {
      id: storyId,
      userId,
      caption,
      backgroundStyle,
      fontStyle,
      privacy,
      expiresAt,
      createdAt: now.toISOString()
    }, 201, 'Story published successfully (24h lifespan active).');
  } catch (err) {
    console.error('[CreateStory Error]', err);
    return errorResponse(res, 'CREATE_STORY_FAILED', 'Could not publish story.', 500);
  }
}

// Record Story View
async function recordStoryView(req, res) {
  try {
    const storyId = req.params.id;
    const viewerId = req.user.id;
    const now = new Date().toISOString();

    const storyRes = await query('SELECT user_id, expires_at, is_deleted FROM stories WHERE id = $1', [storyId]);
    if (storyRes.rows.length === 0 || storyRes.rows[0].is_deleted || new Date(storyRes.rows[0].expires_at) < new Date()) {
      return errorResponse(res, 'STORY_EXPIRED', 'This story is no longer available.', 404);
    }

    // Insert view if not already viewed
    const insertRes = await query(
      `INSERT INTO story_views (id, story_id, viewer_id, viewed_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (story_id, viewer_id) DO NOTHING
       RETURNING id`,
      [uuidv4(), storyId, viewerId, now]
    );

    if (insertRes.rows && insertRes.rows.length > 0) {
      await query('UPDATE stories SET views_count = views_count + 1 WHERE id = $1', [storyId]);
    }

    return successResponse(res, { viewed: true });
  } catch (err) {
    return errorResponse(res, 'VIEW_RECORD_FAILED', 'Could not record story view.', 500);
  }
}

// React to Story (Emoji)
async function reactToStory(req, res) {
  try {
    const storyId = req.params.id;
    const userId = req.user.id;
    const { emoji } = req.body;

    if (!emoji) return errorResponse(res, 'EMOJI_REQUIRED', 'Reaction emoji is required.');

    const storyRes = await query('SELECT user_id FROM stories WHERE id = $1', [storyId]);
    if (storyRes.rows.length === 0) return errorResponse(res, 'NOT_FOUND', 'Story not found.', 404);

    await query(
      `INSERT INTO story_reactions (id, story_id, user_id, emoji)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), storyId, userId, emoji]
    );

    // Notify story author
    const storyAuthorId = storyRes.rows[0].user_id;
    await createNotification({
      recipientId: storyAuthorId,
      actorId: userId,
      type: 'story_reaction',
      referenceId: storyId,
      referenceType: 'story',
      message: `${req.user.username} reacted ${emoji} to your story.`
    });

    return successResponse(res, { reacted: true, emoji }, 200, 'Reaction sent.');
  } catch (err) {
    return errorResponse(res, 'REACT_FAILED', 'Could not send story reaction.', 500);
  }
}

// Delete Own Story
async function deleteStory(req, res) {
  try {
    const storyId = req.params.id;
    const userId = req.user.id;

    const storyRes = await query('SELECT user_id FROM stories WHERE id = $1', [storyId]);
    if (storyRes.rows.length === 0) return errorResponse(res, 'NOT_FOUND', 'Story not found.', 404);

    if (storyRes.rows[0].user_id !== userId && req.user.role !== 'admin') {
      return errorResponse(res, 'FORBIDDEN', 'You can only delete your own stories.', 403);
    }

    await query('UPDATE stories SET is_deleted = TRUE WHERE id = $1', [storyId]);
    return successResponse(res, { deleted: true }, 200, 'Story deleted.');
  } catch (err) {
    return errorResponse(res, 'DELETE_FAILED', 'Could not delete story.', 500);
  }
}

// Story Analytics for the Creator
async function getStoryAnalytics(req, res) {
  try {
    const storyId = req.params.id;
    const userId = req.user.id;

    const storyRes = await query('SELECT user_id, views_count FROM stories WHERE id = $1', [storyId]);
    if (storyRes.rows.length === 0) return errorResponse(res, 'NOT_FOUND', 'Story not found.', 404);

    if (storyRes.rows[0].user_id !== userId && req.user.role !== 'admin') {
      return errorResponse(res, 'FORBIDDEN', 'You can only view analytics for your own story.', 403);
    }

    // Get viewers list with avatars
    const viewersRes = await query(
      `SELECT sv.viewer_id, sv.viewed_at, u.username, pr.display_name, pr.avatar_url
       FROM story_views sv
       JOIN users u ON u.id = sv.viewer_id
       JOIN profiles pr ON pr.user_id = u.id
       WHERE sv.story_id = $1
       ORDER BY sv.viewed_at DESC`,
      [storyId]
    );

    // Get reactions
    const reactionsRes = await query(
      `SELECT sr.emoji, sr.created_at, u.username, pr.avatar_url
       FROM story_reactions sr
       JOIN users u ON u.id = sr.user_id
       JOIN profiles pr ON pr.user_id = u.id
       WHERE sr.story_id = $1
       ORDER BY sr.created_at DESC`,
      [storyId]
    );

    return successResponse(res, {
      storyId,
      viewsCount: storyRes.rows[0].views_count || viewersRes.rows.length,
      viewers: viewersRes.rows,
      reactions: reactionsRes.rows
    });
  } catch (err) {
    return errorResponse(res, 'ANALYTICS_FAILED', 'Could not fetch story analytics.', 500);
  }
}

module.exports = {
  getStoriesFeed,
  createStory,
  recordStoryView,
  reactToStory,
  deleteStory,
  getStoryAnalytics
};
