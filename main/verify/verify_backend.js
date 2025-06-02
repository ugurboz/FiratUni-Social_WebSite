const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../db/models/User');

async function verifyEmail(email, code) {
    try {
        // Kullanıcıyı veritabanından bul
        const user = await User.findOne({ email });
        if (!user) {
            return { success: false, message: 'Kullanıcı bulunamadı' };
        }

        // Doğrulama kodunu kontrol et
        if (user.verificationCode !== code) {
            return { success: false, message: 'Geçersiz doğrulama kodu' };
        }

        // Kullanıcıyı doğrula
        user.isVerified = true;
        user.verificationCode = undefined;
        await user.save();

        return { success: true, message: 'E-posta başarıyla doğrulandı' };
    } catch (error) {
        console.error('Doğrulama hatası:', error);
        return { success: false, message: 'Doğrulama sırasında bir hata oluştu' };
    }
}

async function sendVerificationEmail(user) {
    try {
        // Random doğrulama kodu oluştur
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Kullanıcıyı güncelle
        user.verificationCode = verificationCode;
        await user.save();

        // E-posta gönder
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'E-posta Doğrulama Kodu',
            text: `Merhaba ${user.name},\n\nE-posta doğrulama kodunuz: ${verificationCode}\n\nBu kodu uygulamada doğrulama sayfasında girin.\n\nSaygılarımla,\nFırat Üniversitesi Sosyal Platformu Ekibi`
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        return false;
    }
}

module.exports = {
    verifyEmail,
    sendVerificationEmail
};
