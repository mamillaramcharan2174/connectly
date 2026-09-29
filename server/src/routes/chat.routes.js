const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, chatController.getConversations);
router.post('/direct', authenticateToken, chatController.getOrCreateDirectConversation);
router.post('/group', authenticateToken, chatController.createGroupConversation);

router.get('/:id/messages', authenticateToken, chatController.getMessages);
router.post('/:id/messages', authenticateToken, chatController.sendMessage);

router.post('/messages/:id/react', authenticateToken, chatController.reactToMessage);
router.delete('/messages/:id', authenticateToken, chatController.deleteMessage);

module.exports = router;
