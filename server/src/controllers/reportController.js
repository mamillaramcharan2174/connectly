const { v4: uuidv4 } = require('uuid');
const { query } = require('../database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

const VALID_REASONS = ['spam', 'harassment', 'impersonation', 'inappropriate', 'scam', 'other'];
const VALID_TARGETS = ['user', 'post', 'story', 'comment', 'message'];

async function createReport(req, res) {
  try {
    const reporterId = req.user.id;
    const { targetType, targetId, reason, description = '' } = req.body;

    if (!VALID_TARGETS.includes(targetType)) {
      return errorResponse(res, 'INVALID_TARGET', `targetType must be one of: ${VALID_TARGETS.join(', ')}`);
    }

    if (!VALID_REASONS.includes(reason)) {
      return errorResponse(res, 'INVALID_REASON', `reason must be one of: ${VALID_REASONS.join(', ')}`);
    }

    if (!targetId) {
      return errorResponse(res, 'TARGET_ID_REQUIRED', 'targetId is required.');
    }

    const reportId = uuidv4();
    const now = new Date().toISOString();

    await query(
      `INSERT INTO reports (id, reporter_id, target_type, target_id, reason, description, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [reportId, reporterId, targetType, targetId, reason, description, 'pending', now, now]
    );

    return successResponse(res, { reportId, status: 'pending' }, 201, 'Thank you for reporting. Our moderation team will review this shortly.');
  } catch (err) {
    console.error('[CreateReport Error]', err);
    return errorResponse(res, 'REPORT_FAILED', 'Could not submit report.', 500);
  }
}

module.exports = {
  createReport
};
