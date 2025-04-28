// Gerekli modülleri içe aktarma
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt'); // Şifreleri güvenli bir şekilde saklamak için
const crypto = require('crypto'); // authToken oluşturmak için

// Bağlantı URI'sini kontrol et ve kullan
const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error("MONGODB_URI bulunamadı! .env dosyanızı kontrol edin.");
    process.exit(1);
}

// Veritabanı ve koleksiyon isimleri
const dbName = "firatuni_social";
const usersCollection = "users";

// Kullanıcı girişi fonksiyonu
async function loginUser(email, password) {
    console.log('Login attempt for email:', email); // Debug log
    
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
        console.log('Connecting to MongoDB...'); // Debug log
        await client.connect();
        console.log('Connected to MongoDB'); // Debug log
        
        const database = client.db(dbName);
        const users = database.collection(usersCollection);

        // Kullanıcıyı e-posta ile bul
        console.log('Searching for user...'); // Debug log
        const user = await users.findOne({ email: email });
        console.log('User found:', user ? 'Yes' : 'No'); // Debug log
        
        if (!user) {
            console.log('User not found'); // Debug log
            return { success: false, message: "Kullanıcı bulunamadı" };
        }

        // Şifre kontrolü
        console.log('Checking password...'); // Debug log
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid); // Debug log
        
        if (!isPasswordValid) {
            console.log('Invalid password'); // Debug log
            return { success: false, message: "Hatalı şifre" };
        }

        // AuthToken oluştur
        const authToken = crypto.randomBytes(32).toString('hex');

        // Giriş başarılı
        console.log('Login successful'); // Debug log
        return {
            success: true,
            message: "Giriş başarılı",
            authToken: authToken, // AuthToken'ı ekle
            user: {
                id: user._id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                studentNumber: user.studentNumber,
                department: user.department,
                year: user.year
            }
        };

    } catch (error) {
        console.error("Giriş hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    } finally {
        await client.close();
        console.log('MongoDB connection closed'); // Debug log
    }
}

// Şifre sıfırlama fonksiyonu
async function resetPassword(email) {
    try {
        await client.connect();
        const database = client.db(dbName);
        const users = database.collection(usersCollection);

        // Kullanıcıyı kontrol et
        const user = await users.findOne({ email: email });

        if (!user) {
            return { success: false, message: "Bu e-posta adresi kayıtlı değil" };
        }

        // Gerçek uygulamada burada:
        // 1. Geçici bir token oluştur
        // 2. Token'ı veritabanına kaydet
        // 3. Kullanıcıya e-posta gönder
        // Şimdilik basit bir yanıt döndürelim
        return {
            success: true,
            message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi"
        };

    } catch (error) {
        console.error("Şifre sıfırlama hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    } finally {
        await client.close();
    }
}

// Oturum kontrolü fonksiyonu
async function checkSession(sessionId) {
    try {
        await client.connect();
        const database = client.db(dbName);
        const sessions = database.collection("sessions");

        const session = await sessions.findOne({ sessionId: sessionId });
        return session ? true : false;

    } catch (error) {
        console.error("Oturum kontrolü hatası:", error);
        return false;
    } finally {
        await client.close();
    }
}

// Kullanıcı kayıt fonksiyonu
async function registerUser(userData) {
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
            message: "Kullanıcı başarıyla kaydedildi",
            userId: result.insertedId
        };

    } catch (error) {
        console.error("Kayıt hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    } finally {
        await client.close();
    }
}

// Test fonksiyonu
async function testDatabaseConnection() {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
    
    try {
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("MongoDB'ye başarıyla bağlandı!");
        
        const database = client.db(dbName);
        const collections = await database.listCollections().toArray();
        
        console.log("Mevcut koleksiyonlar:");
        collections.forEach(collection => {
            console.log(` - ${collection.name}`);
        });

    } catch (error) {
        console.error("Bağlantı hatası:", error);
    } finally {
        await client.close();
    }
}

// Fonksiyonları dışa aktar
module.exports = {
    loginUser,
    resetPassword,
    checkSession,
    testDatabaseConnection,
    registerUser
};

// Bağlantıyı test et
testDatabaseConnection().catch(console.error);