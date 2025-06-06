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

        // Kullanıcıyı doğrudan oluştur ve doğrulanmış olarak işaretle
        const userId = await User.create({
            firstName: userData.firstName,
            lastName: userData.lastName,
            studentNumber: userData.studentNumber,
            email: userEmail,
            password: userData.password, // User.create handles hashing
            department: userData.department,
            year: userData.year,
            isVerified: true // Doğrudan doğrulanmış yap
        });

        console.log('Kullanıcı başarıyla kaydedildi. ID:', userId);

        // Başarılı kayıt mesajı döndür
        return {
            success: true,
            message: "Kullanıcı başarıyla kaydedildi. Giriş yapabilirsiniz."
        };

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

        // Kullanıcı e-postasını oluştur
        const userEmail = studentNumber + '@firat.edu.tr';

        // Kullanıcıyı doğrudan oluştur ve doğrulanmış olarak işaretle
        const userId = await User.create({
            firstName,
            lastName,
            studentNumber,
            email: userEmail,
            password,
            department,
            year,
            isVerified: true
        });

        console.log('Kullanıcı başarıyla kaydedildi. ID:', userId);

        res.status(200).json({
            success: true,
            message: 'Kullanıcı başarıyla kaydedildi. Giriş yapabilirsiniz.'
        });
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