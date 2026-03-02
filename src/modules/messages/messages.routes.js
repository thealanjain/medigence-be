const express = require('express');
const router = express.Router();
const messagesController = require('./messages.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.use(authMiddleware);

// GET /messages/:chatId
router.get('/:chatId', messagesController.getMessages);

// POST /messages
router.post('/', messagesController.sendMessage);

// PATCH /messages/:chatId/read
router.patch('/:chatId/read', messagesController.markAsRead);

module.exports = router;
