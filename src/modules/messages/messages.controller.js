const messagesService = require('./messages.service');
const { successResponse, createdResponse } = require('../../utils/response');

const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const result = await messagesService.getMessages(chatId, req.user.userId, page);
    return successResponse(res, result, 'Messages fetched successfully');
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { chatId, message_text } = req.body;
    const message = await messagesService.sendMessage({
      chatId,
      senderId: req.user.userId,
      messageText: message_text,
    });
    return createdResponse(res, { message }, 'Message sent');
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    await messagesService.markAsRead(chatId, req.user.userId);
    return successResponse(res, {}, 'Messages marked as read');
  } catch (error) {
    next(error);
  }
};

module.exports = { getMessages, sendMessage, markAsRead };
