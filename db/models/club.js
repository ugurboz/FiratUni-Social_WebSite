const { pool } = require('../config');

class Club {
  // Create a new club
  static async create(clubData) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO clubs (name, description, logo) VALUES (?, ?, ?)',
        [clubData.name, clubData.description, clubData.logo || null]
      );
      
      const clubId = result.insertId;
      
      // Add the creator as president
      await pool.execute(
        'INSERT INTO club_memberships (clubId, userId, role) VALUES (?, ?, ?)',
        [clubId, clubData.createdBy, 'president']
      );
      
      return clubId;
    } catch (error) {
      console.error('Error creating club:', error);
      throw error;
    }
  }
  
  // Get all clubs
  static async getAll() {
    try {
      const [rows] = await pool.execute(
        `SELECT c.*, 
                (SELECT COUNT(*) FROM club_memberships WHERE clubId = c.id) as memberCount
         FROM clubs c
         ORDER BY c.name ASC`
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting clubs:', error);
      throw error;
    }
  }
  
  // Get clubs that a user is a member of
  static async getByUserId(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT c.*, cm.role as userRole, 
                (SELECT COUNT(*) FROM club_memberships WHERE clubId = c.id) as memberCount
         FROM clubs c
         JOIN club_memberships cm ON c.id = cm.clubId
         WHERE cm.userId = ?
         ORDER BY c.name ASC`,
        [userId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting user clubs:', error);
      throw error;
    }
  }
  
  // Get a club by ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT c.*, 
                (SELECT COUNT(*) FROM club_memberships WHERE clubId = c.id) as memberCount
         FROM clubs c
         WHERE c.id = ?`,
        [id]
      );
      
      if (rows.length === 0) return null;
      
      // Get club president
      const [presidents] = await pool.execute(
        `SELECT u.id, u.firstName, u.lastName, u.email, u.profileImage
         FROM club_memberships cm
         JOIN users u ON cm.userId = u.id
         WHERE cm.clubId = ? AND cm.role = 'president'
         LIMIT 1`,
        [id]
      );
      
      rows[0].president = presidents.length ? presidents[0] : null;
      
      return rows[0];
    } catch (error) {
      console.error('Error getting club by ID:', error);
      throw error;
    }
  }
  
  // Update a club
  static async update(id, clubData, userId) {
    try {
      // Check if user is an admin or president
      const [userRole] = await pool.execute(
        `SELECT role FROM club_memberships 
         WHERE clubId = ? AND userId = ? AND (role = 'admin' OR role = 'president')`,
        [id, userId]
      );
      
      if (userRole.length === 0) {
        throw new Error('Unauthorized: Only club admins or presidents can update club details');
      }
      
      const [result] = await pool.execute(
        'UPDATE clubs SET name = ?, description = ?, logo = ? WHERE id = ?',
        [clubData.name, clubData.description, clubData.logo || null, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating club:', error);
      throw error;
    }
  }
  
  // Delete a club
  static async delete(id, userId) {
    try {
      // Check if user is a president
      const [userRole] = await pool.execute(
        `SELECT role FROM club_memberships 
         WHERE clubId = ? AND userId = ? AND role = 'president'`,
        [id, userId]
      );
      
      if (userRole.length === 0) {
        throw new Error('Unauthorized: Only club presidents can delete clubs');
      }
      
      const [result] = await pool.execute(
        'DELETE FROM clubs WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting club:', error);
      throw error;
    }
  }
  
  // Join a club
  static async join(clubId, userId) {
    try {
      const [result] = await pool.execute(
        'INSERT IGNORE INTO club_memberships (clubId, userId, role) VALUES (?, ?, ?)',
        [clubId, userId, 'member']
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error joining club:', error);
      throw error;
    }
  }
  
  // Leave a club
  static async leave(clubId, userId) {
    try {
      // Check if user is not the president (presidents can't leave)
      const [userRole] = await pool.execute(
        `SELECT role FROM club_memberships 
         WHERE clubId = ? AND userId = ?`,
        [clubId, userId]
      );
      
      if (userRole.length > 0 && userRole[0].role === 'president') {
        throw new Error('Club presidents cannot leave. Transfer presidency first.');
      }
      
      const [result] = await pool.execute(
        'DELETE FROM club_memberships WHERE clubId = ? AND userId = ?',
        [clubId, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error leaving club:', error);
      throw error;
    }
  }
  
  // Get members of a club
  static async getMembers(clubId) {
    try {
      const [rows] = await pool.execute(
        `SELECT u.id, u.firstName, u.lastName, u.email, u.profileImage, u.department, cm.role, cm.joinedAt
         FROM club_memberships cm
         JOIN users u ON cm.userId = u.id
         WHERE cm.clubId = ?
         ORDER BY 
           CASE 
             WHEN cm.role = 'president' THEN 1
             WHEN cm.role = 'admin' THEN 2
             ELSE 3
           END,
           cm.joinedAt ASC`,
        [clubId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting club members:', error);
      throw error;
    }
  }
  
  // Update a member's role
  static async updateMemberRole(clubId, memberId, newRole, userId) {
    try {
      // Check if current user is a president or admin
      const [userRole] = await pool.execute(
        `SELECT role FROM club_memberships 
         WHERE clubId = ? AND userId = ? AND (role = 'admin' OR role = 'president')`,
        [clubId, userId]
      );
      
      if (userRole.length === 0) {
        throw new Error('Unauthorized: Only club admins or presidents can update member roles');
      }
      
      // If current user is admin, they can't promote to president or change other admins
      if (userRole[0].role === 'admin') {
        if (newRole === 'president') {
          throw new Error('Admins cannot promote to president');
        }
        
        // Check if target is already an admin
        const [targetRole] = await pool.execute(
          `SELECT role FROM club_memberships 
           WHERE clubId = ? AND userId = ?`,
          [clubId, memberId]
        );
        
        if (targetRole.length > 0 && targetRole[0].role === 'admin') {
          throw new Error('Admins cannot change other admins');
        }
      }
      
      // If setting president, ensure there is only one president
      if (newRole === 'president') {
        await pool.execute(
          `UPDATE club_memberships 
           SET role = 'admin' 
           WHERE clubId = ? AND role = 'president'`,
          [clubId]
        );
      }
      
      const [result] = await pool.execute(
        'UPDATE club_memberships SET role = ? WHERE clubId = ? AND userId = ?',
        [newRole, clubId, memberId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }
  
  // Get events associated with a club
  static async getEvents(clubId) {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, 
                (SELECT COUNT(*) FROM event_participants WHERE eventId = e.id) as participantCount
         FROM events e
         WHERE e.clubId = ?
         ORDER BY 
           CASE 
             WHEN e.status = 'upcoming' THEN 1
             WHEN e.status = 'ongoing' THEN 2
             ELSE 3
           END,
           e.startDate ASC`,
        [clubId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting club events:', error);
      throw error;
    }
  }
}

module.exports = Club; 