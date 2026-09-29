const { errorResponse } = require('../utils/responseFormatter');

function requireAdmin(req, res, next) {
  if (!req.user) {
    return errorResponse(res, 'UNAUTHORIZED', 'Authentication is required.', 401);
  }

  if (req.user.role !== 'admin') {
    return errorResponse(res, 'FORBIDDEN', 'Access denied. Administrator privileges required.', 403);
  }

  next();
}

module.exports = {
  requireAdmin
};
