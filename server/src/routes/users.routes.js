const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.get('/search', optionalAuth, userController.searchUsers);
router.get('/:username', optionalAuth, userController.getProfileByUsername);
router.patch('/me', authenticateToken, userController.updateProfile);

router.post('/:id/follow', authenticateToken, userController.followUser);
router.delete('/:id/follow', authenticateToken, userController.unfollowUser);

router.post('/:id/block', authenticateToken, userController.blockUser);
router.delete('/:id/block', authenticateToken, userController.unblockUser);

router.post('/:id/mute', authenticateToken, userController.muteUser);

module.exports = router;
