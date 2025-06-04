// Gerekli modülleri içe aktarma
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { getDb } = require('../../db/config'); // DB bağlantısı için
const bcrypt = require('bcryptjs'); // Şifre hashlemek için
const { sendWelcomeEmail } = require('../shared/emailService'); // E-posta servisi
const { sendVerificationEmail } = require('../verify/verify_backend');
const express = require('express');
const router = express.Router();
const User = require('../../db/models/User');

// Kayıt işlemi
async function handleRegister(userData, req) {
    console.log('Register attempt with data:', JSON.stringify(userData)); // Debug log
    try {
        // Veritabanına bağlan
        const db = await getDb();
        console.log('Connected to database'); // Debug log
        
        const usersCollection = db.collection('users');
        console.log('Accessing users collection'); // Debug log
        
        // E-posta kontrolü
        console.log('Checking if email exists:', userData.studentNumber); // Debug log
        const existingUser = await usersCollection.findOne({ studentNumber: userData.studentNumber });
        console.log('Existing user found:', existingUser ? 'Yes' : 'No'); // Debug log
        
        if (existingUser) {
            console.log('User already exists'); // Debug log
            return { success: false, message: "Bu öğrenci numarası zaten kayıtlı" };
        }

        // Kullanıcı e-postasını oluştur
        const userEmail = userData.studentNumber + '@firat.edu.tr';
        
        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 60000); // 1 minute from now
        
        // Kullanıcı verilerini geçici olarak sakla
        const tempUserData = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            studentNumber: userData.studentNumber,
            email: userEmail,
            password: userData.password,
            department: userData.department,
            year: userData.year,
            verificationCode,
            verificationCodeExpires,
            isVerified: false
        };

        // Send verification email
        try {
            await sendVerificationEmail({
                email: userEmail,
                firstName: userData.firstName,
                verificationCode: verificationCode
            });
            console.log('Verification email sent to:', userEmail);

            // Geçici kullanıcı verilerini session'a kaydet
            req.session.tempUserData = tempUserData;
            
            console.log('User data stored in session'); // Debug log
            return {
                success: true,
                message: "Doğrulama kodu e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin."
            };
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            return { success: false, message: "Doğrulama e-postası gönderilemedi. Lütfen tekrar deneyin." };
        }

    } catch (error) {
        console.error("Kayıt hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    }
}

// Kullanıcı bilgilerini getir
async function getUser(email) {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');
        
        const user = await usersCollection.findOne({ email: email });
        if (user) {
            return user;
        } else {
            throw new Error('Kullanıcı bulunamadı');
        }
    } catch (error) {
        throw error;
    }
}

// E-posta kontrolü
async function checkEmail(email) {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');
        
        const existingUser = await usersCollection.findOne({ email: email });
        return !!existingUser;
    } catch (error) {
        console.error("E-posta kontrolü hatası:", error);
        return false;
    }
}

// Kullanıcı adı kontrolü (studentNumber kontrolü olarak güncellenebilir)
async function checkUsername(studentNumber) {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');
        
        const existingUser = await usersCollection.findOne({ studentNumber: studentNumber });
        return !!existingUser;
    } catch (error) {
        console.error("Öğrenci numarası kontrolü hatası:", error);
        return false;
    }
}

router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, studentNumber, email, password, department, year } = req.body;

        // E-posta kontrolü
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
        }

        // Öğrenci numarası kontrolü
        const existingStudent = await User.findOne({ studentNumber });
        if (existingStudent) {
            return res.status(400).json({ message: 'Bu öğrenci numarası zaten kullanılıyor' });
        }

        // Doğrulama kodu oluştur
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 60000); // 1 dakika

        // Kullanıcı verilerini geçici olarak sakla
        const tempUserData = {
            firstName,
            lastName,
            studentNumber,
            email,
            password,
            department,
            year,
            verificationCode,
            verificationCodeExpires,
            isVerified: false
        };

        // E-posta gönder
        try {
            await sendVerificationEmail({
                email,
                firstName,
                verificationCode
            });

            // Geçici kullanıcı verilerini session'a kaydet
            req.session.tempUserData = tempUserData;

            res.status(200).json({
                success: true,
                message: 'Doğrulama kodu e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.'
            });
        } catch (error) {
            console.error('E-posta gönderme hatası:', error);
            res.status(500).json({ message: 'E-posta gönderilirken bir hata oluştu' });
        }
    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({ message: 'Kayıt işlemi sırasında bir hata oluştu' });
    }
});

module.exports = {
    handleRegister,
    getUser,
    checkEmail,
    checkUsername,
    router
};