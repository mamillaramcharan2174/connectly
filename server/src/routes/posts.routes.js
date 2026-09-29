const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.get('/feed', optionalAuth, postController.getFeed);
router.get('/saved', authenticateToken, postController.getSavedPosts);
router.get('/:id', optionalAuth, postController.getPostById);

router.post('/', authenticateToken, postController.createPost);
router.patch('/:id', authenticateToken, postController.updatePostCaption);
router.delete('/:id', authenticateToken, postController.deletePost);

router.post('/:id/like', authenticateToken, postController.toggleLikePost);
router.post('/:id/save', authenticateToken, postController.toggleSavePost);

router.get('/:id/comments', optionalAuth, postController.getComments);
router.post('/:id/comments', authenticateToken, postController.addComment);

module.exports = router;
