const chatsService = require('./chats.service');
const { successResponse } = require('../../utils/response');

const getMyChats = async (req, res, next) => {
  try {
    const chats = await chatsService.getMyChats(req.user.userId, req.user.role);
    return successResponse(res, { chats }, 'Chats fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getChatById = async (req, res, next) => {
  try {
    const chat = await chatsService.getChatById(req.params.chatId, req.user.userId);
    return successResponse(res, { chat }, 'Chat fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyChats, getChatById };
