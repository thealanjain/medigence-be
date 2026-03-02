const messagesRepo = require('./messages.repository');
const chatsRepo = require('../chats/chats.repository');

const assertChatAccess = async (chatId, userId) => {
  const isMember = await chatsRepo.isUserInChat(chatId, userId);
  if (!isMember) {
    const error = new Error('You are not authorized to access this chat');
    error.statusCode = 403;
    error.isOperational = true;
    throw error;
  }
};

const getMessages = async (chatId, userId, page = 1) => {
  await assertChatAccess(chatId, userId);

  const limit = 50;
  const offset = (page - 1) * limit;
  const messages = await messagesRepo.getMessagesByChatId(chatId, limit, offset);

  return { messages, page, limit };
};

const sendMessage = async ({ chatId, senderId, messageText }) => {
  await assertChatAccess(chatId, senderId);

  if (!messageText || messageText.trim().length === 0) {
    const error = new Error('Message cannot be empty');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  if (messageText.length > 5000) {
    const error = new Error('Message too long (max 5000 characters)');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  return await messagesRepo.createMessage({ chatId, senderId, messageText: messageText.trim() });
};

const markAsRead = async (chatId, userId) => {
  await assertChatAccess(chatId, userId);
  return await messagesRepo.markMessagesAsRead(chatId, userId);
};

module.exports = { getMessages, sendMessage, markAsRead };
