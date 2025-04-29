const { pool } = require('../config');

class Post {
  // Create a new post
  static async create(postData) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO posts (userId, content, image) VALUES (?, ?, ?)',
        [postData.userId, postData.content, postData.image || null]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }
  
  // Get all posts with user information
  static async getAll(limit = 20, offset = 0) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, u.firstName, u.lastName, u.profileImage,
                (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount
         FROM posts p
         JOIN users u ON p.userId = u.id
         ORDER BY p.createdAt DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  }
  
  // Get posts by user ID
  static async getByUserId(userId, limit = 20, offset = 0) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, u.firstName, u.lastName, u.profileImage,
                (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount
         FROM posts p
         JOIN users u ON p.userId = u.id
         WHERE p.userId = ?
         ORDER BY p.createdAt DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting user posts:', error);
      throw error;
    }
  }
  
  // Get a post by ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, u.firstName, u.lastName, u.profileImage
         FROM posts p
         JOIN users u ON p.userId = u.id
         WHERE p.id = ?`,
        [id]
      );
      
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error getting post by ID:', error);
      throw error;
    }
  }
  
  // Update a post
  static async update(id, userId, content) {
    try {
      const [result] = await pool.execute(
        'UPDATE posts SET content = ? WHERE id = ? AND userId = ?',
        [content, id, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }
  
  // Delete a post
  static async delete(id, userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM posts WHERE id = ? AND userId = ?',
        [id, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
  
  // Get comments for a post
  static async getComments(postId) {
    try {
      const [rows] = await pool.execute(
        `SELECT c.*, u.firstName, u.lastName, u.profileImage
         FROM comments c
         JOIN users u ON c.userId = u.id
         WHERE c.postId = ?
         ORDER BY c.createdAt ASC`,
        [postId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }
  
  // Add a comment to a post
  static async addComment(postId, userId, content) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO comments (postId, userId, content) VALUES (?, ?, ?)',
        [postId, userId, content]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }
  
  // Like a post
  static async like(postId, userId) {
    try {
      // Add to likes table
      await pool.execute(
        'INSERT IGNORE INTO likes (postId, userId) VALUES (?, ?)',
        [postId, userId]
      );
      
      // Update likes count in posts table
      await pool.execute(
        `UPDATE posts SET likes = 
         (SELECT COUNT(*) FROM likes WHERE postId = ?) 
         WHERE id = ?`,
        [postId, postId]
      );
      
      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }
  
  // Unlike a post
  static async unlike(postId, userId) {
    try {
      // Remove from likes table
      await pool.execute(
        'DELETE FROM likes WHERE postId = ? AND userId = ?',
        [postId, userId]
      );
      
      // Update likes count in posts table
      await pool.execute(
        `UPDATE posts SET likes = 
         (SELECT COUNT(*) FROM likes WHERE postId = ?) 
         WHERE id = ?`,
        [postId, postId]
      );
      
      return true;
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  }
  
  // Check if a user has liked a post
  static async hasLiked(postId, userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT 1 FROM likes WHERE postId = ? AND userId = ?',
        [postId, userId]
      );
      
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking like status:', error);
      throw error;
    }
  }
}

module.exports = Post; 