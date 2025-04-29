const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection settings
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'firatuni_social';

let client;
let db;

async function setupDatabase() {
    try {
        // Connect to MongoDB
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log('Connected to MongoDB successfully');

        // Create collections if they don't exist
        const collections = ['users', 'posts', 'comments', 'likes', 'events', 'clubs', 'messages'];
        const existingCollections = await db.listCollections().toArray();
        const existingCollectionNames = existingCollections.map(col => col.name);

        for (const collectionName of collections) {
            if (!existingCollectionNames.includes(collectionName)) {
                await db.createCollection(collectionName);
                console.log(`Created collection: ${collectionName}`);
            }
        }

        // Create indexes
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
        await db.collection('posts').createIndex({ userId: 1 });
        await db.collection('comments').createIndex({ postId: 1 });
        await db.collection('likes').createIndex({ postId: 1 });
        await db.collection('events').createIndex({ date: 1 });
        await db.collection('clubs').createIndex({ name: 1 }, { unique: true });
        await db.collection('messages').createIndex({ senderId: 1, receiverId: 1 });

        console.log('Database setup completed successfully');
    } catch (error) {
        console.error('Error setting up database:', error);
        throw error;
    } finally {
        if (client) {
            await client.close();
        }
    }
}

module.exports = {
    setupDatabase
}; 