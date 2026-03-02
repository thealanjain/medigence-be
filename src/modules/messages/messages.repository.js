const { query } = require('../../database/db');

const getMessagesByChatId = async (chatId, limit = 50, offset = 0) => {
  const result = await query(
    `SELECT m.id, m.chat_id, m.sender_id, m.message_text, m.is_read, m.created_at,
            u.email AS sender_email,
            COALESCE(pp.full_name, d.name) AS sender_name,
            u.role AS sender_role
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     LEFT JOIN patient_profiles pp ON pp.user_id = m.sender_id
     LEFT JOIN doctors d ON d.user_id = m.sender_id
     WHERE m.chat_id = $1
     ORDER BY m.created_at ASC
     LIMIT $2 OFFSET $3`,
    [chatId, limit, offset]
  );
  return result.rows;
};

const createMessage = async ({ chatId, senderId, messageText }) => {
  const result = await query(
    `INSERT INTO messages (chat_id, sender_id, message_text)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [chatId, senderId, messageText]
  );
  return result.rows[0];
};

const markMessagesAsRead = async (chatId, readerId) => {
  const result = await query(
    `UPDATE messages
     SET is_read = true
     WHERE chat_id = $1 AND sender_id != $2 AND is_read = false
     RETURNING id`,
    [chatId, readerId]
  );
  return result.rows;
};

const getMessageById = async (messageId) => {
  const result = await query('SELECT * FROM messages WHERE id = $1', [messageId]);
  return result.rows[0] || null;
};

const getUnreadCount = async (chatId, userId) => {
  const result = await query(
    `SELECT COUNT(*) as count FROM messages
     WHERE chat_id = $1 AND sender_id != $2 AND is_read = false`,
    [chatId, userId]
  );
  return parseInt(result.rows[0].count, 10);
};

module.exports = {
  getMessagesByChatId,
  createMessage,
  markMessagesAsRead,
  getMessageById,
  getUnreadCount,
};
