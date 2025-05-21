// Gerekli modülleri içe aktarma
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs'); // Şifreleri güvenli bir şekilde saklamak için
const jwt = require('jsonwebtoken'); // JWT için
const { getDb } = require('../../db/config'); // DB bağlantısı için
const { sendPasswordResetEmail, sendVerificationEmail } = require('../shared/emailService'); // E-posta servisi
const crypto = require('crypto');

// Kullanıcı girişi fonksiyonu
async function loginUser(email, password) {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ email: email });
        
        if (!user) {
            return { success: false, message: "Kullanıcı bulunamadı" };
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return { success: false, message: "Hatalı şifre" };
        }

        // E-posta doğrulaması kontrolü
        if (!user.emailVerified) {
            // Yeni doğrulama kodu oluştur
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

            // Kodu veritabanına kaydet
            await usersCollection.updateOne(
                { email: email },
                { 
                    $set: { 
                        verificationCode: verificationCode,
                        verificationCodeExpiry: verificationCodeExpiry
                    } 
                }
            );

            // Doğrulama e-postası gönder
            await sendVerificationEmail(email, verificationCode);

            return {
                success: true,
                needsVerification: true,
                message: "E-posta adresinize doğrulama kodu gönderildi"
            };
        }

        // Normal login işlemi
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            },
            process.env.JWT_SECRET || 'begakkom-secret-key-2024',
            { expiresIn: '24h' }
        );

        return {
            success: true,
            message: "Giriş başarılı",
            authToken: token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                studentNumber: user.studentNumber,
                department: user.department,
                year: user.year,
                theme: user.theme || 'light'
            }
        };
    } catch (error) {
        console.error("Giriş hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    }
}

// Doğrulama kodu kontrolü
async function verifyEmail(email, code) {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');
        
        const user = await usersCollection.findOne({ 
            email: email,
            verificationCode: code,
            verificationCodeExpiry: { $gt: new Date() }
        });

        if (!user) {
            return { success: false, message: "Geçersiz veya süresi dolmuş doğrulama kodu" };
        }

        // E-posta doğrulandı olarak işaretle
        await usersCollection.updateOne(
            { email: email },
            { 
                $set: { emailVerified: true },
                $unset: { verificationCode: "", verificationCodeExpiry: "" }
            }
        );

        return { success: true, message: "E-posta adresi başarıyla doğrulandı" };
    } catch (error) {
        console.error("Doğrulama hatası:", error);
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

        // Şifre sıfırlama token'ı oluştur
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 saat geçerli

        // Token'ı veritabanına kaydet
        await usersCollection.updateOne(
            { email: email },
            { 
                $set: { 
                    resetToken: resetToken,
                    resetTokenExpiry: resetTokenExpiry 
                } 
            }
        );

        // Şifre sıfırlama bağlantısı oluştur
        const resetLink = `https://begakkom.onrender.com/main/reset_password/reset_password_screen.html?token=${resetToken}`;

        // E-posta gönder
        const emailResult = await sendPasswordResetEmail(email, resetLink);

        if (emailResult.success) {
            return {
                success: true,
                message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi"
            };
        } else {
            console.error("E-posta gönderme hatası:", emailResult.error);
            return { 
                success: false, 
                message: "Şifre sıfırlama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin." 
            };
        }

    } catch (error) {
        console.error("Şifre sıfırlama hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    }
}

// Token ile şifre sıfırlama işlemi
async function resetPasswordWithToken(token, newPassword) {
    try {
        // Veritabanına bağlan
        const db = await getDb();
        const usersCollection = db.collection('users');
        
        // Token ile kullanıcıyı bul
        const user = await usersCollection.findOne({ 
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() } // Token'ın süresi dolmamış olmalı
        });

        if (!user) {
            return { 
                success: false, 
                message: "Geçersiz veya süresi dolmuş token. Lütfen şifre sıfırlama işlemini tekrar başlatın." 
            };
        }

        // Şifreyi hashle
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Şifreyi güncelle ve token bilgilerini temizle
        await usersCollection.updateOne(
            { email: user.email },
            { 
                $set: { password: hashedPassword },
                $unset: { resetToken: "", resetTokenExpiry: "" }
            }
        );

        return {
            success: true,
            message: "Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz."
        };

    } catch (error) {
        console.error("Şifre sıfırlama hatası:", error);
        return { success: false, message: "Şifre güncellenirken bir hata oluştu." };
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
    verifyEmail,
    resetPassword,
    resetPasswordWithToken,
    checkSession,
    testDatabaseConnection
};

// Bağlantıyı test et (isteğe bağlı)
// testDatabaseConnection().catch(console.error);