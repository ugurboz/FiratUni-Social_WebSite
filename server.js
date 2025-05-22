const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const authenticate = require('./server/middleware/authMiddleware');
const { loginUser, resetPassword, resetPasswordWithToken } = require('./main/login/login_backend');
const { handleRegister } = require('./main/register/register_backend');
const { getUserProfile } = require('./main/profil/profil_backend');
const { getClubs, joinClub, leaveClub, getClubDetails, initializeClubs } = require('./main/kulupler/kulupler_backend');
const { testConnection, getDb } = require('./db/config');
const uploadRoute = require('./server/routes/upload');
const { verifyEmail } = require('./main/verify/verify_backend');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Güvenlik Middleware'leri
// CORS yapılandırması
const allowedOrigins = [
    'https://begakkom.onrender.com',
    'http://localhost:3000',
    'http://localhost:5000'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS politikası tarafından engellendi'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Helmet güvenlik başlıkları
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    }
}));

// MongoDB sanitization
app.use(mongoSanitize());

// XSS koruması
app.use(xss());

// Rate limiting yapılandırması
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // IP başına maksimum istek
    message: {
        status: 429,
        error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.'
    }
});

// Auth işlemleri için özel rate limiter
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 saat
    max: 5, // IP başına maksimum başarısız giriş denemesi
    message: {
        status: 429,
        error: 'Çok fazla başarısız giriş denemesi. Lütfen 1 saat sonra tekrar deneyin.'
    }
});

// Rate limiter'ları uygula
app.use('/api/', limiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/reset-password', authLimiter);

// Diğer middleware'ler
app.use(express.json());

// Serve static files - sıralama önemli
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/main', express.static(path.join(__dirname, 'main')));
app.use(express.static(path.join(__dirname)));

// Upload rotasını kullan
app.use('/api', uploadRoute);

// Veritabanı bağlantısını test et
testConnection()
  .then(success => {
    if (success) {
      console.log('Veritabanı bağlantısı başarılı!');
    } else {
      console.error('Veritabanı bağlantı testi başarısız!');
    }
  })
  .catch(err => {
    console.error('Veritabanı bağlantı testi hatası:', err);
  });

// API Routes
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser(email, password);
        res.json(result);
    } catch (error) {
        console.error('Login API error:', error);
        res.status(500).json({ success: false, message: 'Bir hata oluştu' });
    }
});

app.post('/api/reset-password', async (req, res) => {
    try {
        const { email } = req.body;
        const result = await resetPassword(email);
        res.json(result);
    } catch (error) {
        console.error('Reset password API error:', error);
        res.status(500).json({ success: false, message: 'Bir hata oluştu' });
    }
});

app.post('/api/reset-password-with-token', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Token ve yeni şifre gereklidir' 
            });
        }
        
        // Şifre gücü kontrolü
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message
            });
        }

        const result = await resetPasswordWithToken(token, newPassword);
        res.json(result);
    } catch (error) {
        console.error('Token ile şifre sıfırlama hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Bir hata oluştu' 
        });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const result = await handleRegister(req.body);
        res.json(result);
    } catch (error) {
        console.error('Register API error:', error);
        res.status(500).json({ success: false, message: 'Bir hata oluştu' });
    }
});

// Korumalı route'lar
app.get('/api/profile', authenticate, async (req, res) => {
    try {
        const userEmail = req.user.email; // JWT'den gelen email
        const result = await getUserProfile(userEmail);
        res.json(result);
    } catch (error) {
        console.error('Profile API error:', error);
        res.status(500).json({ success: false, message: 'Bir hata oluştu' });
    }
});

app.post('/api/user/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const email = req.user.email; // JWT'den gelen email

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mevcut şifre ve yeni şifre gereklidir.' 
            });
        }
        
        // Şifre gücü kontrolü
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message
            });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');
        
        // Kullanıcıyı bul
        const user = await usersCollection.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kullanıcı bulunamadı' 
            });
        }

        // Mevcut şifreyi kontrol et
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isPasswordValid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mevcut şifre hatalı' 
            });
        }

        // Yeni şifreyi hashle
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Şifreyi güncelle
        await usersCollection.updateOne(
            { email: email },
            { $set: { password: hashedPassword } }
        );

        res.json({ 
            success: true, 
            message: 'Şifreniz başarıyla güncellendi' 
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ success: false, message: 'Bir hata oluştu' });
    }
});

// Veritabanı içeriğini görmek için geliştirici endpoint'i
app.get('/api/debug/users', async (req, res) => {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');
        
        // In-memory veritabanında users koleksiyonunu doğrudan döndür
        const allUsers = usersCollection.data || [];
        console.log(`Total users in database: ${allUsers.length}`);
        
        // Güvenlik nedeniyle şifreleri gizle
        const sanitizedUsers = allUsers.map(user => {
            const { password, ...userData } = user;
            return { ...userData, hasPassword: !!password };
        });
        
        res.json({ success: true, users: sanitizedUsers });
    } catch (error) {
        console.error('Debug API error:', error);
        res.status(500).json({ success: false, message: 'Bir hata oluştu' });
    }
});

// Kulüp işlemleri için endpoint'ler
app.get('/api/clubs', async (req, res) => {
    try {
        const result = await getClubs();
        res.json(result);
    } catch (error) {
        console.error('Kulüpleri getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Bir hata oluştu' });
    }
});

app.get('/api/clubs/:clubId', async (req, res) => {
    try {
        const { clubId } = req.params;
        const result = await getClubDetails(clubId);
        res.json(result);
    } catch (error) {
        console.error('Kulüp detayları getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Bir hata oluştu' });
    }
});

app.post('/join-club', async (req, res) => {
    const { clubName, email } = req.body;

    if (!email) {
        return res.json({ success: false, message: 'Oturum açmanız gerekiyor' });
    }

    const result = await joinClub(clubName, email);
    res.json(result);
});

app.post('/leave-club', async (req, res) => {
    const { clubName, email } = req.body;

    if (!email) {
        return res.json({ success: false, message: 'Oturum açmanız gerekiyor' });
    }

    const result = await leaveClub(clubName, email);
    res.json(result);
});

// Kullanıcı hesabını silme endpoint'i
app.delete('/api/user/delete-account', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'E-posta adresi gereklidir.' 
            });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');
        
        // Kullanıcıyı bul
        const user = await usersCollection.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kullanıcı bulunamadı.' 
            });
        }
        
        // Kullanıcıyı sil
        await usersCollection.deleteOne({ email });
        
        console.log(`Kullanıcı hesabı silindi: ${email}`);
        
        res.json({ 
            success: true, 
            message: 'Hesabınız başarıyla silindi.' 
        });
    } catch (error) {
        console.error('Hesap silme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Hesap silinirken bir hata oluştu.' 
        });
    }
});

// Kullanıcı bilgilerini güncelleme endpoint'i
app.put('/api/user/settings', async (req, res) => {
    try {
        const { email, firstName, lastName, department, yearOfStudy } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'E-posta adresi gereklidir.' 
            });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');
        
        // Kullanıcıyı bul
        const user = await usersCollection.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kullanıcı bulunamadı.' 
            });
        }
        
        // Güncellenecek alanları içeren obje
        const updateFields = {};
        
        if (firstName !== undefined) updateFields.firstName = firstName;
        if (lastName !== undefined) updateFields.lastName = lastName;
        if (department !== undefined) updateFields.department = department;
        if (yearOfStudy !== undefined) updateFields.yearOfStudy = yearOfStudy;
        
        // Alanları güncelle
        await usersCollection.updateOne(
            { email },
            { $set: updateFields }
        );
        
        console.log(`Kullanıcı bilgileri güncellendi: ${email}`);
        
        // Güncellenmiş kullanıcı bilgilerini getir
        const updatedUser = await usersCollection.findOne({ email });
        
        res.json({ 
            success: true, 
            message: 'Bilgileriniz başarıyla güncellendi.',
            user: updatedUser
        });
    } catch (error) {
        console.error('Kullanıcı bilgileri güncelleme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Bilgileriniz güncellenirken bir hata oluştu.' 
        });
    }
});

// Kullanıcı tema tercihi güncelleme endpoint'i
app.put('/api/user/theme', async (req, res) => {
    try {
        const { email, theme } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'E-posta adresi gereklidir.' 
            });
        }

        if (!theme || (theme !== 'light' && theme !== 'dark')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Geçerli bir tema tercihi gereklidir (light veya dark).' 
            });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');
        
        // Kullanıcıyı bul
        const user = await usersCollection.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kullanıcı bulunamadı.' 
            });
        }
        
        // Tema tercihini güncelle
        await usersCollection.updateOne(
            { email },
            { $set: { theme: theme } }
        );
        
        console.log(`Kullanıcı tema tercihi güncellendi: ${email}, tema: ${theme}`);
        
        res.json({ 
            success: true, 
            message: 'Tema tercihiniz başarıyla güncellendi.',
            theme: theme
        });
    } catch (error) {
        console.error('Tema tercihi güncelleme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Tema tercihi güncellenirken bir hata oluştu.' 
        });
    }
});

// E-posta doğrulama endpoint'i
app.post('/api/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;
        const result = await verifyEmail(email, code);
        res.json(result);
    } catch (error) {
        console.error('Email verification API error:', error);
        res.status(500).json({ success: false, message: 'Bir hata oluştu' });
    }
});

// Route handlers for pages - Her zaman tam dosya yolunu kullan
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main', 'anasayfa', 'anasayfa_screen.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'main', 'login', 'login_screen.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'main', 'register', 'register_screen.html'));
});

app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'main', 'login', 'reset_password_screen.html'));
});

app.get('/anasayfa', (req, res) => {
    res.sendFile(path.join(__dirname, 'main', 'anasayfa', 'anasayfa_screen.html'));
});

// SPA-style route handler - Client-side routing için
app.get('*', (req, res, next) => {
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'main', 'anasayfa', 'anasayfa_screen.html'));
    } else {
        next();
    }
});

// Error handler for file not found
app.use((req, res, next) => {
    const filePath = path.join(__dirname, req.path);
    console.log('Requested path:', req.path);
    console.log('Attempted file path:', filePath);
    next();
});

// Error handler for 404 - Page Not Found
app.use((req, res) => {
    console.log('404 Error for:', req.path);
    res.status(404).sendFile(path.join(__dirname, 'main', '404.html'), (err) => {
        if (err) {
            console.error('Error sending 404 page:', err);
            res.status(404).send('404 - Page Not Found');
        }
    });
});

// Şifre gücünü kontrol eden yardımcı fonksiyon
function validatePasswordStrength(password) {
    if (password.length < 8) {
        return { valid: false, message: 'Şifre en az 8 karakter uzunluğunda olmalıdır.' };
    }
    
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Şifre en az bir büyük harf içermelidir.' };
    }
    
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Şifre en az bir küçük harf içermelidir.' };
    }
    
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Şifre en az bir rakam içermelidir.' };
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { valid: false, message: 'Şifre en az bir özel karakter içermelidir (!, @, #, $ vb.).' };
    }
    
    return { valid: true };
}

// Start the server
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Sadece kulüpleri başlat
    await initializeClubs();
    
    // Log the available routes
    console.log('Available routes:');
    console.log('- GET  /', path.join(__dirname, 'main', 'anasayfa', 'anasayfa_screen.html'));
    console.log('- GET  /login', path.join(__dirname, 'main', 'login', 'login_screen.html'));
    console.log('- GET  /register', path.join(__dirname, 'main', 'register', 'register_screen.html'));
    console.log('- GET  /reset-password', path.join(__dirname, 'main', 'login', 'reset_password_screen.html'));
    console.log('- GET  /anasayfa', path.join(__dirname, 'main', 'anasayfa', 'anasayfa_screen.html'));
    console.log('- POST /api/login');
    console.log('- POST /api/register');
    console.log('- POST /api/reset-password');
    console.log('- GET  /api/profile');
    console.log('- GET  /api/debug/users');
    console.log('- GET  /api/clubs');
    console.log('- GET  /api/clubs/:clubId');
    console.log('- POST /join-club');
    console.log('- POST /leave-club');
    console.log('- POST /api/user/change-password');
    console.log('- DELETE /api/user/delete-account');
    console.log('- PUT  /api/user/settings');
    console.log('- PUT  /api/user/theme');
    console.log('- POST /api/verify-email');
}); 