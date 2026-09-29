const path = require('path');

function getBaseUrl(req) {
  if (process.env.CDN_URL) {
    return process.env.CDN_URL;
  }
  const protocol = req ? req.protocol : 'http';
  const host = req ? req.get('host') : `localhost:${process.env.PORT || 5000}`;
  return `${protocol}://${host}`;
}

function formatFileResponse(req, file) {
  const baseUrl = getBaseUrl(req);
  const mediaUrl = `${baseUrl}/uploads/${file.filename}`;
  const isVideo = file.mimetype.startsWith('video');
  const isAudio = file.mimetype.startsWith('audio');
  const mediaType = isVideo ? 'video' : isAudio ? 'voice' : 'image';

  return {
    url: mediaUrl,
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    mediaType,
    thumbnailUrl: mediaUrl // In production CDN thumbnail pipeline or sharp
  };
}

module.exports = {
  getBaseUrl,
  formatFileResponse
};
