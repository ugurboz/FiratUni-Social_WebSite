const { pool } = require('../config');

class Event {
  // Create a new event
  static async create(eventData) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO events (name, description, location, startDate, endDate, 
                            maxParticipants, category, createdBy, clubId) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventData.name,
          eventData.description,
          eventData.location,
          eventData.startDate,
          eventData.endDate || null,
          eventData.maxParticipants || null,
          eventData.category || 'other',
          eventData.createdBy,
          eventData.clubId || null
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }
  
  // Get all events with creator information
  static async getAll() {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, u.firstName, u.lastName, 
                (SELECT COUNT(*) FROM event_participants WHERE eventId = e.id) as participantCount,
                c.name as clubName
         FROM events e
         JOIN users u ON e.createdBy = u.id
         LEFT JOIN clubs c ON e.clubId = c.id
         ORDER BY 
           CASE 
             WHEN e.status = 'upcoming' THEN 1
             WHEN e.status = 'ongoing' THEN 2
             ELSE 3
           END,
           e.startDate ASC`
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  }
  
  // Get events by status
  static async getByStatus(status) {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, u.firstName, u.lastName, 
                (SELECT COUNT(*) FROM event_participants WHERE eventId = e.id) as participantCount,
                c.name as clubName
         FROM events e
         JOIN users u ON e.createdBy = u.id
         LEFT JOIN clubs c ON e.clubId = c.id
         WHERE e.status = ?
         ORDER BY e.startDate ASC`,
        [status]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting events by status:', error);
      throw error;
    }
  }
  
  // Get events by user ID (events created by the user)
  static async getByUserId(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, 
                (SELECT COUNT(*) FROM event_participants WHERE eventId = e.id) as participantCount,
                c.name as clubName
         FROM events e
         LEFT JOIN clubs c ON e.clubId = c.id
         WHERE e.createdBy = ?
         ORDER BY 
           CASE 
             WHEN e.status = 'upcoming' THEN 1
             WHEN e.status = 'ongoing' THEN 2
             ELSE 3
           END,
           e.startDate ASC`,
        [userId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting user events:', error);
      throw error;
    }
  }
  
  // Get events that a user is participating in
  static async getParticipating(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, u.firstName, u.lastName, 
                (SELECT COUNT(*) FROM event_participants WHERE eventId = e.id) as participantCount,
                c.name as clubName,
                ep.status as participationStatus
         FROM events e
         JOIN users u ON e.createdBy = u.id
         LEFT JOIN clubs c ON e.clubId = c.id
         JOIN event_participants ep ON e.id = ep.eventId
         WHERE ep.userId = ?
         ORDER BY 
           CASE 
             WHEN e.status = 'upcoming' THEN 1
             WHEN e.status = 'ongoing' THEN 2
             ELSE 3
           END,
           e.startDate ASC`,
        [userId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting participating events:', error);
      throw error;
    }
  }
  
  // Get a event by ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, u.firstName, u.lastName, 
                (SELECT COUNT(*) FROM event_participants WHERE eventId = e.id) as participantCount,
                c.name as clubName
         FROM events e
         JOIN users u ON e.createdBy = u.id
         LEFT JOIN clubs c ON e.clubId = c.id
         WHERE e.id = ?`,
        [id]
      );
      
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error getting event by ID:', error);
      throw error;
    }
  }
  
  // Update an event
  static async update(id, eventData) {
    try {
      const [result] = await pool.execute(
        `UPDATE events 
         SET name = ?, description = ?, location = ?, startDate = ?, 
             endDate = ?, maxParticipants = ?, category = ?, status = ?
         WHERE id = ? AND createdBy = ?`,
        [
          eventData.name,
          eventData.description,
          eventData.location,
          eventData.startDate,
          eventData.endDate || null,
          eventData.maxParticipants || null,
          eventData.category || 'other',
          eventData.status,
          id,
          eventData.createdBy
        ]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }
  
  // Delete an event
  static async delete(id, userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM events WHERE id = ? AND createdBy = ?',
        [id, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
  
  // Join an event
  static async join(eventId, userId) {
    try {
      const [result] = await pool.execute(
        'INSERT IGNORE INTO event_participants (eventId, userId) VALUES (?, ?)',
        [eventId, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error joining event:', error);
      throw error;
    }
  }
  
  // Cancel participation in an event
  static async cancelParticipation(eventId, userId) {
    try {
      const [result] = await pool.execute(
        'UPDATE event_participants SET status = "cancelled" WHERE eventId = ? AND userId = ?',
        [eventId, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error cancelling event participation:', error);
      throw error;
    }
  }
  
  // Get participants of an event
  static async getParticipants(eventId) {
    try {
      const [rows] = await pool.execute(
        `SELECT u.id, u.firstName, u.lastName, u.email, u.profileImage, ep.status, ep.registeredAt
         FROM event_participants ep
         JOIN users u ON ep.userId = u.id
         WHERE ep.eventId = ?
         ORDER BY ep.registeredAt ASC`,
        [eventId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting event participants:', error);
      throw error;
    }
  }
  
  // Update event status based on date
  static async updateStatuses() {
    try {
      const now = new Date();
      
      // Update to ongoing
      await pool.execute(
        `UPDATE events 
         SET status = 'ongoing' 
         WHERE status = 'upcoming' 
           AND startDate <= ? 
           AND (endDate IS NULL OR endDate >= ?)`,
        [now, now]
      );
      
      // Update to past
      await pool.execute(
        `UPDATE events 
         SET status = 'past' 
         WHERE (status = 'upcoming' OR status = 'ongoing') 
           AND ((endDate IS NOT NULL AND endDate < ?) 
                OR (endDate IS NULL AND startDate < ?))`,
        [now, now]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating event statuses:', error);
      throw error;
    }
  }
}

module.exports = Event; 