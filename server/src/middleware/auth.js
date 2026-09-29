const { verifyAccessToken } = require('../utils/security');
const { errorResponse } = require('../utils/responseFormatter');
const { query } = require('../database');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return errorResponse(res, 'UNAUTHORIZED', 'Authentication token is missing.', 401);
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return errorResponse(res, 'TOKEN_EXPIRED', 'Token is invalid or has expired.', 401);
  }

  try {
    const userRes = await query('SELECT id, username, email, role, is_suspended FROM users WHERE id = $1', [decoded.id]);
    if (userRes.rows.length === 0) {
      return errorResponse(res, 'USER_NOT_FOUND', 'User belonging to this token no longer exists.', 401);
    }

    const user = userRes.rows[0];
    if (user.is_suspended) {
      return errorResponse(res, 'ACCOUNT_SUSPENDED', 'This account has been suspended for violating terms.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err);
    return errorResponse(res, 'SERVER_ERROR', 'Authentication verification failed.', 500);
  }
}

// Optional Auth (for public feed endpoints where guest viewing is allowed)
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = null;
    return next();
  }

  const decoded = verifyAccessToken(token);
  if (decoded) {
    try {
      const userRes = await query('SELECT id, username, email, role FROM users WHERE id = $1', [decoded.id]);
      if (userRes.rows.length > 0) {
        req.user = userRes.rows[0];
      }
    } catch (_) {}
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth
};
