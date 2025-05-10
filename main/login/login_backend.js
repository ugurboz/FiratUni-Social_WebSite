// Gerekli modülleri içe aktarma
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs'); // Şifreleri güvenli bir şekilde saklamak için
const crypto = require('crypto'); // authToken oluşturmak için
const { getDb } = require('../../db/config'); // DB bağlantısı için

// Kullanıcı girişi fonksiyonu
async function loginUser(email, password) {
    console.log('Login attempt for email:', email); // Debug log
    
    try {
        console.log('Searching for user...'); // Debug log
        
        // Veritabanına bağlan
        const db = await getDb();
        const usersCollection = db.collection('users');
        
        // Kullanıcıyı e-posta ile bul
        const user = await usersCollection.findOne({ email: email });
        console.log('User found:', user ? 'Yes' : 'No'); // Debug log
        
        if (!user) {
            console.log('User not found'); // Debug log
            return { success: false, message: "Kullanıcı bulunamadı" };
        }

        // Normal şifre kontrolü
        console.log('Checking password...'); // Debug log
        // Veritabanındaki şifre ile girilen şifreyi doğrudan karşılaştır
        const isPasswordValid = password === user.password;
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
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                studentNumber: user.studentNumber,
                department: user.department,
                year: user.year
            }
        };

    } catch (error) {
        console.error("Giriş hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    }
}

// Şifre sıfırlama fonksiyonu
async function resetPassword(email) {
    try {
        // Veritabanına bağlan
        const db = await getDb();
        const usersCollection = db.collection('users');
        
        // Kullanıcıyı kontrol et
        const user = await usersCollection.findOne({ email: email });

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
    }
}

// Oturum kontrolü fonksiyonu - JWT implementasyonu gerekli
async function checkSession(sessionId) {
    try {
        // JWT verify yapılmalı
        return false; // Şimdilik false döndür
    } catch (error) {
        console.error("Oturum kontrolü hatası:", error);
        return false;
    }
}

// Veritabanı bağlantı testi
async function testDatabaseConnection() {
    try {
        const db = await getDb();
        
        // Koleksiyonları listele
        const collections = await db.listCollections().toArray();
        console.log("Mevcut koleksiyonlar:");
        collections.forEach(collection => {
            console.log(` - ${collection.name}`);
        });
        
    } catch (error) {
        console.error("Bağlantı hatası:", error);
    }
}

// Fonksiyonları dışa aktar
module.exports = {
    loginUser,
    resetPassword,
    checkSession,
    testDatabaseConnection
};

// Bağlantıyı test et (isteğe bağlı)
// testDatabaseConnection().catch(console.error);