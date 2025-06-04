const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mongo7db:veritabani07@cluster0.5ktgw25.mongodb.net/firatuni_social?retryWrites=true&w=majority&appName=Cluster0';
let dbConnection = null;
let connectionPromise = null;

async function connectToDatabase() {
    if (dbConnection) {
        return dbConnection;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    connectionPromise = new Promise((resolve, reject) => {
        const client = new MongoClient(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        });

        client.connect()
            .then(() => {
                console.log('MongoDB Atlas\'a başarıyla bağlandı.');
                dbConnection = client.db();
                resolve(dbConnection);
            })
            .catch(err => {
                console.error('MongoDB bağlantı hatası:', err);
                connectionPromise = null;
                reject(err);
            });
    });

    return connectionPromise;
}

async function getDb() {
    if (!dbConnection) {
        await connectToDatabase();
    }
    return dbConnection;
}

async function testConnection() {
    try {
        const db = await getDb();
        await db.command({ ping: 1 });
        console.log('MongoDB bağlantısı başarılı');
        return true;
    } catch (error) {
        console.error('MongoDB bağlantı testi başarısız:', error);
        return false;
    }
}

module.exports = {
    getDb,
    testConnection,
    connectToDatabase
}; 