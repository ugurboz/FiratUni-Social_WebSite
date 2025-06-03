const { getDb } = require('../config');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create(userData) {
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Insert user into database
      const db = await getDb();
      const collection = db.collection('users');
      
      const result = await collection.insertOne({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        studentNumber: userData.studentNumber || null,
        department: userData.department || null,
        year: userData.year || null,
        isAdmin: userData.isAdmin || false,
        createdAt: new Date()
      });
      
      return result.insertedId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  // Find user by email
  static async findByEmail(email) {
    try {
      const db = await getDb();
      const collection = db.collection('users');
      
      return await collection.findOne({ email: email });
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }
  
  // Find user by ID
  static async findById(id) {
    try {
      const db = await getDb();
      const collection = db.collection('users');
      
      return await collection.findOne(
        { _id: id },
        { projection: { password: 0 } } // Exclude password
      );
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }
  
  // Update user profile
  static async update(id, userData) {
    try {
      const db = await getDb();
      const collection = db.collection('users');
      
      const result = await collection.updateOne(
        { _id: id },
        { $set: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            department: userData.department || null,
            year: userData.year || null,
            bio: userData.bio || null,
            interests: userData.interests || null,
            profileImage: userData.profileImage || null,
            isAdmin: userData.isAdmin || false,
            updatedAt: new Date()
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }
  
  // Change password
  static async changePassword(id, newPassword) {
    try {
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      const db = await getDb();
      const collection = db.collection('users');
      
      const result = await collection.updateOne(
        { _id: id },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Set admin status
  static async setAdminStatus(id, isAdmin) {
    try {
      const db = await getDb();
      const collection = db.collection('users');
      
      const result = await collection.updateOne(
        { _id: id },
        { $set: { isAdmin: isAdmin, updatedAt: new Date() } }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error setting admin status:', error);
      throw error;
    }
  }
}

module.exports = User; 