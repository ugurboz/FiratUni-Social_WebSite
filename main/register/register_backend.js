// Gerekli modülleri içe aktarma
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { getDb } = require('../../db/config'); // DB bağlantısı için
const bcrypt = require('bcryptjs'); // Şifre hashlemek için
const { sendWelcomeEmail } = require('../shared/emailService'); // E-posta servisi

// Kayıt işlemi
async function handleRegister(userData) {
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

        // Şifreyi hashle
        console.log('Hashing password'); // Debug log
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        // Kullanıcı e-postasını oluştur
        const userEmail = userData.studentNumber + '@firat.edu.tr';
        
        // Kullanıcı verilerini hazırla
        const newUser = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            studentNumber: userData.studentNumber,
            username: userData.studentNumber,
            email: userEmail,
            password: hashedPassword,
            department: userData.department,
            year: userData.year,
            createdAt: new Date()
        };
        
        // Kullanıcıyı oluştur
        console.log('Inserting new user to database'); // Debug log
        const result = await usersCollection.insertOne(newUser);
        console.log('Insert result:', result); // Debug log
        
        // Hoş geldiniz e-postası gönder
        try {
            await sendWelcomeEmail(userEmail, userData.firstName);
            console.log('Welcome email sent to:', userEmail);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // E-posta gönderilemese bile kayıt işlemi başarılı sayılır
        }
        
        console.log('User registered successfully'); // Debug log
        return {
            success: true,
            message: "Kullanıcı başarıyla kaydedildi",
            userId: result.insertedId
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

module.exports = {
    handleRegister,
    getUser,
    checkEmail,
    checkUsername
};