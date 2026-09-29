const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');
const { formatFileResponse } = require('../services/mediaStorageService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return errorResponse(res, 'NO_FILE', 'No file was provided for upload.', 400);
  }

  const fileData = formatFileResponse(req, req.file);
  return successResponse(res, fileData, 201, 'File uploaded successfully.');
});

router.post('/multiple', authenticateToken, upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return errorResponse(res, 'NO_FILES', 'No files were provided for upload.', 400);
  }

  const files = req.files.map(f => formatFileResponse(req, f));
  return successResponse(res, { files }, 201, 'Files uploaded successfully.');
});

module.exports = router;
