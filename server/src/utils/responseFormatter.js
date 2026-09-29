/**
 * Standard API Response Formatter for Connectly
 * Enforces requirement:
 * Success: { success: true, data: ... }
 * Error: { success: false, error: { code: string, message: string } }
 */

function successResponse(res, data = {}, statusCode = 200, message = null) {
  const payload = {
    success: true,
    data
  };
  if (message) payload.message = message;
  return res.status(statusCode).json(payload);
}

function errorResponse(res, code = 'INVALID_REQUEST', message = 'The request could not be completed.', statusCode = 400, details = null) {
  const payload = {
    success: false,
    error: {
      code,
      message
    }
  };
  if (details && process.env.NODE_ENV !== 'production') {
    payload.error.details = details;
  }
  return res.status(statusCode).json(payload);
}

module.exports = {
  successResponse,
  errorResponse
};
