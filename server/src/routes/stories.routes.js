const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, storyController.getStoriesFeed);
router.post('/', authenticateToken, storyController.createStory);
router.delete('/:id', authenticateToken, storyController.deleteStory);

router.post('/:id/view', authenticateToken, storyController.recordStoryView);
router.post('/:id/reaction', authenticateToken, storyController.reactToStory);
router.get('/:id/analytics', authenticateToken, storyController.getStoryAnalytics);

module.exports = router;
