const { pool } = require('../config');

class Message {
  // Send a message
  static async send(messageData) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)',
        [messageData.senderId, messageData.receiverId, messageData.content]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  
  // Get conversation between two users
  static async getConversation(userId1, userId2, limit = 50) {
    try {
      const [rows] = await pool.execute(
        `SELECT m.*, 
                s.firstName as senderFirstName, s.lastName as senderLastName, s.profileImage as senderImage,
                r.firstName as receiverFirstName, r.lastName as receiverLastName, r.profileImage as receiverImage
         FROM messages m
         JOIN users s ON m.senderId = s.id
         JOIN users r ON m.receiverId = r.id
         WHERE (m.senderId = ? AND m.receiverId = ?) OR (m.senderId = ? AND m.receiverId = ?)
         ORDER BY m.createdAt DESC
         LIMIT ?`,
        [userId1, userId2, userId2, userId1, limit]
      );
      
      // Mark messages as read
      await pool.execute(
        'UPDATE messages SET isRead = 1 WHERE senderId = ? AND receiverId = ? AND isRead = 0',
        [userId2, userId1]
      );
      
      return rows.reverse();
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }
  
  // Get recent conversations for a user
  static async getRecentConversations(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          CASE WHEN m.senderId = ? THEN m.receiverId ELSE m.senderId END AS otherUserId,
          CASE WHEN m.senderId = ? 
              THEN CONCAT(u2.firstName, ' ', u2.lastName) 
              ELSE CONCAT(u1.firstName, ' ', u1.lastName) 
          END AS otherUserName,
          CASE WHEN m.senderId = ? THEN u2.profileImage ELSE u1.profileImage END AS otherUserImage,
          COUNT(CASE WHEN m.isRead = 0 AND m.receiverId = ? THEN 1 END) AS unreadCount,
          MAX(m.createdAt) AS lastMessageTime,
          (SELECT content FROM messages 
            WHERE ((senderId = ? AND receiverId = otherUserId) OR (senderId = otherUserId AND receiverId = ?))
            ORDER BY createdAt DESC LIMIT 1) AS lastMessage
        FROM messages m
        JOIN users u1 ON m.senderId = u1.id
        JOIN users u2 ON m.receiverId = u2.id
        WHERE m.senderId = ? OR m.receiverId = ?
        GROUP BY otherUserId, otherUserName, otherUserImage
        ORDER BY lastMessageTime DESC`,
        [userId, userId, userId, userId, userId, userId, userId, userId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting recent conversations:', error);
      throw error;
    }
  }
  
  // Mark messages as read
  static async markAsRead(senderId, receiverId) {
    try {
      const [result] = await pool.execute(
        'UPDATE messages SET isRead = 1 WHERE senderId = ? AND receiverId = ? AND isRead = 0',
        [senderId, receiverId]
      );
      
      return result.affectedRows;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }
  
  // Get unread message count for a user
  static async getUnreadCount(userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM messages WHERE receiverId = ? AND isRead = 0',
        [userId]
      );
      
      return rows[0].count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
  
  // Delete a message
  static async delete(messageId, userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM messages WHERE id = ? AND (senderId = ? OR receiverId = ?)',
        [messageId, userId, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
  
  // Search messages
  static async search(userId, searchTerm) {
    try {
      const [rows] = await pool.execute(
        `SELECT m.*, 
                s.firstName as senderFirstName, s.lastName as senderLastName, 
                r.firstName as receiverFirstName, r.lastName as receiverLastName
         FROM messages m
         JOIN users s ON m.senderId = s.id
         JOIN users r ON m.receiverId = r.id
         WHERE (m.senderId = ? OR m.receiverId = ?) AND m.content LIKE ?
         ORDER BY m.createdAt DESC
         LIMIT 50`,
        [userId, userId, `%${searchTerm}%`]
      );
      
      return rows;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }
}

module.exports = Message; 