const chatsRepo = require('./chats.repository');

const getMyChats = async (userId, role) => {
  return await chatsRepo.getChatsByUserId(userId, role);
};

const getChatById = async (chatId, userId) => {
  const chat = await chatsRepo.getChatById(chatId);
  if (!chat) {
    const error = new Error('Chat not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  // Security: only participants can view chat
  const isMember = await chatsRepo.isUserInChat(chatId, userId);
  if (!isMember) {
    const error = new Error('You are not a participant of this chat');
    error.statusCode = 403;
    error.isOperational = true;
    throw error;
  }

  return chat;
};

module.exports = { getMyChats, getChatById };
