const express = require('express');
const router = express.Router();
const chatsController = require('./chats.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.use(authMiddleware);

// GET /chats/my
router.get('/my', chatsController.getMyChats);

// GET /chats/:chatId
router.get('/:chatId', chatsController.getChatById);

module.exports = router;
