// Gerekli modülleri içe aktarma
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');

// Bağlantı URI'sini kontrol et ve kullan
const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error("MONGODB_URI bulunamadı! .env dosyanızı kontrol edin.");
    process.exit(1);
}

// Veritabanı ve koleksiyon isimleri
const dbName = "firatuni_social";
const usersCollection = "users";

// Kayıt işlemi
async function handleRegister(userData) {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
        maxPoolSize: 10,
        minPoolSize: 1,
        maxIdleTimeMS: 30000,
        connectTimeoutMS: 10000
    });

    try {
        await client.connect();
        const database = client.db(dbName);
        const users = database.collection(usersCollection);

        // E-posta kontrolü
        const existingUser = await users.findOne({ email: userData.email });
        if (existingUser) {
            return { success: false, message: "Bu e-posta adresi zaten kayıtlı" };
        }

        // Şifreyi hashle
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

        // Kullanıcı verilerini hazırla
        const newUser = {
            ...userData,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Kullanıcıyı veritabanına ekle
        const result = await users.insertOne(newUser);

        return {
            success: true,
            message: "Kullanıt başarıyla kaydedildi",
            userId: result.insertedId
        };

    } catch (error) {
        console.error("Kayıt hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    } finally {
        await client.close();
    }
}

// Kullanıcı bilgilerini getir
async function getUser(username) {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();
        const database = client.db(dbName);
        const users = database.collection(usersCollection);

        const user = await users.findOne({ username: username });
        if (user) {
            return user;
        } else {
            throw new Error('Kullanıcı bulunamadı');
        }
    } catch (error) {
        throw error;
    } finally {
        await client.close();
    }
}

// E-posta kontrolü
async function checkEmail(email) {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();
        const database = client.db(dbName);
        const users = database.collection(usersCollection);

        const existingUser = await users.findOne({ email: email });
        return !!existingUser;

    } catch (error) {
        console.error("E-posta kontrolü hatası:", error);
        return false;
    } finally {
        await client.close();
    }
}

// Kullanıcı adı kontrolü
async function checkUsername(username) {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();
        const database = client.db(dbName);
        const users = database.collection(usersCollection);

        const existingUser = await users.findOne({ username: username });
        return !!existingUser;

    } catch (error) {
        console.error("Kullanıcı adı kontrolü hatası:", error);
        return false;
    } finally {
        await client.close();
    }
}

module.exports = {
    handleRegister,
    getUser,
    checkEmail,
    checkUsername
}; 