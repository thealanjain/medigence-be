const { query } = require('../../database/db');

const getChatsByUserId = async (userId, role) => {
  let sql;
  if (role === 'PATIENT') {
    sql = `
      SELECT c.id, c.created_at,
             d.name AS doctor_name, d.specialization,
             du.email AS doctor_email,
             u.email AS patient_email,
             (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.is_read = false AND m.sender_id != $1) AS unread_count,
             (SELECT m.message_text FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
             (SELECT m.created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at
      FROM chats c
      JOIN users u ON u.id = c.patient_id
      JOIN users du ON du.id = c.doctor_id
      JOIN doctors d ON d.user_id = c.doctor_id
      WHERE c.patient_id = $1
      ORDER BY last_message_at DESC NULLS LAST`;
  } else {
    sql = `
      SELECT c.id, c.created_at,
             pp.full_name AS patient_name,
             pu.email AS patient_email,
             u.email AS doctor_email,
             (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.is_read = false AND m.sender_id != $1) AS unread_count,
             (SELECT m.message_text FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
             (SELECT m.created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at
      FROM chats c
      JOIN users u ON u.id = c.doctor_id
      JOIN users pu ON pu.id = c.patient_id
      LEFT JOIN patient_profiles pp ON pp.user_id = c.patient_id
      WHERE c.doctor_id = $1
      ORDER BY last_message_at DESC NULLS LAST`;
  }
  const result = await query(sql, [userId]);
  return result.rows;
};

const getChatById = async (chatId) => {
  const result = await query(
    `SELECT c.*, 
            d.name AS doctor_name, d.specialization,
            pp.full_name AS patient_name
     FROM chats c
     LEFT JOIN doctors d ON d.user_id = c.doctor_id
     LEFT JOIN patient_profiles pp ON pp.user_id = c.patient_id
     WHERE c.id = $1`,
    [chatId]
  );
  return result.rows[0] || null;
};

const isUserInChat = async (chatId, userId) => {
  const result = await query(
    'SELECT id FROM chats WHERE id = $1 AND (patient_id = $2 OR doctor_id = $2)',
    [chatId, userId]
  );
  return result.rowCount > 0;
};

module.exports = { getChatsByUserId, getChatById, isUserInChat };
