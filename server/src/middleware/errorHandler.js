const { errorResponse } = require('../utils/responseFormatter');

function errorHandler(err, req, res, next) {
  console.error('[Unhandled Error]', err.stack || err.message || err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'FILE_TOO_LARGE', 'The uploaded file exceeds the 50MB size limit.', 400);
    }
    return errorResponse(res, 'UPLOAD_ERROR', err.message, 400);
  }

  if (err.message && err.message.includes('Unsupported file type')) {
    return errorResponse(res, 'INVALID_FILE_TYPE', err.message, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred on the server.' 
    : err.message || 'Internal Server Error';

  return errorResponse(res, 'INTERNAL_SERVER_ERROR', message, statusCode);
}

module.exports = errorHandler;
