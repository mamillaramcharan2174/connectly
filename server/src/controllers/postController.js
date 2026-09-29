const { v4: uuidv4 } = require('uuid');
const { query } = require('../database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { createNotification } = require('../services/notificationService');

// Get Personalized Home Feed with Pagination
async function getFeed(req, res) {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const offset = (page - 1) * limit;

    // Retrieve public posts and posts from followed creators
    const postsRes = await query(
      `SELECT p.id, p.user_id, p.caption, p.location, p.privacy, p.likes_count, p.comments_count, p.shares_count, p.created_at,
              u.username, pr.display_name, pr.avatar_url
       FROM posts p
       JOIN users u ON u.id = p.user_id
       JOIN profiles pr ON pr.user_id = u.id
       WHERE p.is_deleted = FALSE AND p.is_archived = FALSE AND u.is_suspended = FALSE
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const posts = [];
    for (const post of postsRes.rows) {
      // Get all media items for carousel support
      const mediaRes = await query(
        `SELECT id, media_url, media_type, thumbnail_url, order_index, width, height
         FROM post_media
         WHERE post_id = $1
         ORDER BY order_index ASC`,
        [post.id]
      );

      // Check if current user liked / saved
      let isLiked = false;
      let isSaved = false;

      if (currentUserId) {
        const likeCheck = await query('SELECT id FROM likes WHERE user_id = $1 AND post_id = $2', [currentUserId, post.id]);
        isLiked = likeCheck.rows.length > 0;

        const saveCheck = await query('SELECT id FROM saved_posts WHERE user_id = $1 AND post_id = $2', [currentUserId, post.id]);
        isSaved = saveCheck.rows.length > 0;
      }

      // Extract hashtags from caption
      const hashtags = (post.caption.match(/#[a-zA-Z0-9_]+/g) || []).map(t => t.replace('#', ''));

      posts.push({
        id: post.id,
        user: {
          id: post.user_id,
          username: post.username,
          displayName: post.display_name,
          avatarUrl: post.avatar_url
        },
        caption: post.caption,
        location: post.location,
        privacy: post.privacy,
        likesCount: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        sharesCount: post.shares_count || 0,
        createdAt: post.created_at,
        media: mediaRes.rows,
        hashtags,
        isLiked,
        isSaved,
        isOwner: currentUserId === post.user_id
      });
    }

    return successResponse(res, {
      posts,
      page,
      hasMore: posts.length === limit
    });
  } catch (err) {
    console.error('[GetFeed Error]', err);
    return errorResponse(res, 'FEED_FAILED', 'Could not load home feed.', 500);
  }
}

// Get Single Post Detail
async function getPostById(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    const postRes = await query(
      `SELECT p.id, p.user_id, p.caption, p.location, p.privacy, p.likes_count, p.comments_count, p.shares_count, p.created_at,
              u.username, pr.display_name, pr.avatar_url
       FROM posts p
       JOIN users u ON u.id = p.user_id
       JOIN profiles pr ON pr.user_id = u.id
       WHERE p.id = $1 AND p.is_deleted = FALSE`,
      [id]
    );

    if (postRes.rows.length === 0) {
      return errorResponse(res, 'POST_NOT_FOUND', 'Post not found.', 404);
    }

    const post = postRes.rows[0];
    const mediaRes = await query(
      'SELECT id, media_url, media_type, thumbnail_url, order_index FROM post_media WHERE post_id = $1 ORDER BY order_index ASC',
      [post.id]
    );

    let isLiked = false;
    let isSaved = false;
    if (currentUserId) {
      const likeCheck = await query('SELECT id FROM likes WHERE user_id = $1 AND post_id = $2', [currentUserId, post.id]);
      isLiked = likeCheck.rows.length > 0;
      const saveCheck = await query('SELECT id FROM saved_posts WHERE user_id = $1 AND post_id = $2', [currentUserId, post.id]);
      isSaved = saveCheck.rows.length > 0;
    }

    return successResponse(res, {
      id: post.id,
      user: {
        id: post.user_id,
        username: post.username,
        displayName: post.display_name,
        avatarUrl: post.avatar_url
      },
      caption: post.caption,
      location: post.location,
      privacy: post.privacy,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      sharesCount: post.shares_count,
      createdAt: post.created_at,
      media: mediaRes.rows,
      isLiked,
      isSaved,
      isOwner: currentUserId === post.user_id
    });
  } catch (err) {
    console.error('[GetPostById Error]', err);
    return errorResponse(res, 'SERVER_ERROR', 'Could not retrieve post.', 500);
  }
}

// Create Post with multiple media files/URLs, caption, hashtags, mentions, location
async function createPost(req, res) {
  try {
    const userId = req.user.id;
    const { caption = '', location = '', privacy = 'public', media = [] } = req.body;

    if (!Array.isArray(media) || media.length === 0) {
      return errorResponse(res, 'MEDIA_REQUIRED', 'A post must include at least one photo or video.');
    }

    const postId = uuidv4();
    const now = new Date().toISOString();

    // Insert post
    await query(
      `INSERT INTO posts (id, user_id, caption, location, privacy, likes_count, comments_count, shares_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [postId, userId, caption, location, privacy, 0, 0, 0, now, now]
    );

    // Insert post media
    for (let i = 0; i < media.length; i++) {
      const item = media[i];
      const mediaId = uuidv4();
      await query(
        `INSERT INTO post_media (id, post_id, media_url, media_type, thumbnail_url, order_index, width, height)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [mediaId, postId, item.url || item.mediaUrl, item.type || item.mediaType || 'image', item.thumbnailUrl || item.url, i, 1080, 1080]
      );
    }

    // Increment post count in profile
    await query('UPDATE profiles SET posts_count = posts_count + 1 WHERE user_id = $1', [userId]);

    // Handle hashtags
    const hashtags = (caption.match(/#[a-zA-Z0-9_]+/g) || []).map(t => t.replace('#', '').toLowerCase());
    for (const tag of hashtags) {
      const tagId = uuidv4();
      await query(
        `INSERT INTO hashtags (id, tag, posts_count) VALUES ($1, $2, 1)
         ON CONFLICT (tag) DO UPDATE SET posts_count = hashtags.posts_count + 1`,
        [tagId, tag]
      );
    }

    // Handle mentions
    const mentions = (caption.match(/@[a-zA-Z0-9_]+/g) || []).map(m => m.replace('@', '').toLowerCase());
    for (const mentionName of mentions) {
      const mUser = await query('SELECT id FROM users WHERE username = $1', [mentionName]);
      if (mUser.rows.length > 0) {
        const mentionedId = mUser.rows[0].id;
        await query(
          'INSERT INTO mentions (id, post_id, mentioned_user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [uuidv4(), postId, mentionedId]
        );
        await createNotification({
          recipientId: mentionedId,
          actorId: userId,
          type: 'mention',
          referenceId: postId,
          referenceType: 'post',
          message: `${req.user.username} mentioned you in a post.`
        });
      }
    }

    return successResponse(res, {
      id: postId,
      caption,
      location,
      privacy,
      createdAt: now,
      media
    }, 201, 'Post created successfully.');
  } catch (err) {
    console.error('[CreatePost Error]', err);
    return errorResponse(res, 'CREATE_FAILED', 'Could not create post.', 500);
  }
}

// Edit Post Caption
async function updatePostCaption(req, res) {
  try {
    const { id } = req.params;
    const { caption } = req.body;
    const userId = req.user.id;

    const postCheck = await query('SELECT user_id FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0) return errorResponse(res, 'NOT_FOUND', 'Post not found.', 404);
    if (postCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
      return errorResponse(res, 'FORBIDDEN', 'You can only edit your own posts.', 403);
    }

    await query('UPDATE posts SET caption = $1, updated_at = $2 WHERE id = $3', [caption, new Date().toISOString(), id]);
    return successResponse(res, { id, caption }, 200, 'Post updated successfully.');
  } catch (err) {
    return errorResponse(res, 'UPDATE_FAILED', 'Could not update post.', 500);
  }
}

// Delete Post (Soft or Hard)
async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const postCheck = await query('SELECT user_id FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0) return errorResponse(res, 'NOT_FOUND', 'Post not found.', 404);
    if (postCheck.rows[0].user_id !== userId && req.user.role !== 'admin') {
      return errorResponse(res, 'FORBIDDEN', 'You can only delete your own posts.', 403);
    }

    await query('UPDATE posts SET is_deleted = TRUE WHERE id = $1', [id]);
    await query('UPDATE profiles SET posts_count = posts_count - 1 WHERE user_id = $1', [postCheck.rows[0].user_id]);

    return successResponse(res, { deleted: true }, 200, 'Post deleted successfully.');
  } catch (err) {
    return errorResponse(res, 'DELETE_FAILED', 'Could not delete post.', 500);
  }
}

// Like / Unlike Post
async function toggleLikePost(req, res) {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const postRes = await query('SELECT user_id, likes_count FROM posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) return errorResponse(res, 'NOT_FOUND', 'Post not found.', 404);

    const postOwnerId = postRes.rows[0].user_id;
    const existing = await query('SELECT id FROM likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);

    if (existing.rows.length > 0) {
      // Unlike
      await query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
      await query('UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1', [postId]);
      return successResponse(res, { isLiked: false }, 200, 'Post unliked.');
    } else {
      // Like
      await query('INSERT INTO likes (id, user_id, post_id) VALUES ($1, $2, $3)', [uuidv4(), userId, postId]);
      await query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1', [postId]);

      // Notify post author
      await createNotification({
        recipientId: postOwnerId,
        actorId: userId,
        type: 'like_post',
        referenceId: postId,
        referenceType: 'post',
        message: `${req.user.username} liked your post.`
      });

      return successResponse(res, { isLiked: true }, 200, 'Post liked.');
    }
  } catch (err) {
    console.error('[ToggleLike Error]', err);
    return errorResponse(res, 'LIKE_FAILED', 'Could not update like status.', 500);
  }
}

// Get Comments for Post
async function getComments(req, res) {
  try {
    const postId = req.params.id;
    const commentsRes = await query(
      `SELECT c.id, c.content, c.likes_count, c.parent_id, c.created_at,
              u.id as user_id, u.username, pr.display_name, pr.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.user_id
       JOIN profiles pr ON pr.user_id = u.id
       WHERE c.post_id = $1 AND c.is_deleted = FALSE
       ORDER BY c.created_at ASC`,
      [postId]
    );

    return successResponse(res, { comments: commentsRes.rows });
  } catch (err) {
    return errorResponse(res, 'COMMENTS_FAILED', 'Could not load comments.', 500);
  }
}

// Add Comment or Reply
async function addComment(req, res) {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content, parentId = null } = req.body;

    if (!content || !content.trim()) {
      return errorResponse(res, 'EMPTY_COMMENT', 'Comment content cannot be empty.');
    }

    const postRes = await query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) return errorResponse(res, 'NOT_FOUND', 'Post not found.', 404);

    const commentId = uuidv4();
    const now = new Date().toISOString();

    await query(
      `INSERT INTO comments (id, post_id, user_id, parent_id, content, likes_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [commentId, postId, userId, parentId, content.trim(), 0, now, now]
    );

    await query('UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1', [postId]);

    // Send notification
    const postOwnerId = postRes.rows[0].user_id;
    await createNotification({
      recipientId: postOwnerId,
      actorId: userId,
      type: parentId ? 'comment_reply' : 'comment',
      referenceId: postId,
      referenceType: 'post',
      message: `${req.user.username} commented: "${content.trim().slice(0, 40)}${content.length > 40 ? '...' : ''}"`
    });

    const userProfile = await query('SELECT display_name, avatar_url FROM profiles WHERE user_id = $1', [userId]);

    return successResponse(res, {
      id: commentId,
      postId,
      userId,
      username: req.user.username,
      displayName: userProfile.rows[0]?.display_name,
      avatarUrl: userProfile.rows[0]?.avatar_url,
      parentId,
      content: content.trim(),
      likesCount: 0,
      createdAt: now
    }, 201, 'Comment added successfully.');
  } catch (err) {
    console.error('[AddComment Error]', err);
    return errorResponse(res, 'COMMENT_FAILED', 'Could not add comment.', 500);
  }
}

// Toggle Save Post
async function toggleSavePost(req, res) {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const existing = await query('SELECT id FROM saved_posts WHERE user_id = $1 AND post_id = $2', [userId, postId]);
    if (existing.rows.length > 0) {
      await query('DELETE FROM saved_posts WHERE user_id = $1 AND post_id = $2', [userId, postId]);
      return successResponse(res, { isSaved: false }, 200, 'Post removed from saved.');
    } else {
      await query('INSERT INTO saved_posts (id, user_id, post_id) VALUES ($1, $2, $3)', [uuidv4(), userId, postId]);
      return successResponse(res, { isSaved: true }, 200, 'Post saved.');
    }
  } catch (err) {
    return errorResponse(res, 'SAVE_FAILED', 'Could not save post.', 500);
  }
}

// Get Saved Posts for User
async function getSavedPosts(req, res) {
  try {
    const userId = req.user.id;
    const savedRes = await query(
      `SELECT p.id, p.caption, p.likes_count, p.comments_count, p.created_at,
              (SELECT media_url FROM post_media WHERE post_id = p.id ORDER BY order_index ASC LIMIT 1) as thumbnail_url
       FROM saved_posts sp
       JOIN posts p ON p.id = sp.post_id
       WHERE sp.user_id = $1 AND p.is_deleted = FALSE
       ORDER BY sp.created_at DESC`,
      [userId]
    );

    return successResponse(res, { posts: savedRes.rows });
  } catch (err) {
    return errorResponse(res, 'GET_SAVED_FAILED', 'Could not load saved posts.', 500);
  }
}

module.exports = {
  getFeed,
  getPostById,
  createPost,
  updatePostCaption,
  deletePost,
  toggleLikePost,
  getComments,
  addComment,
  toggleSavePost,
  getSavedPosts
};
