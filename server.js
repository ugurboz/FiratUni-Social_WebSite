const express = require('express');
const cors = require('cors');
const path = require('path');
const { loginUser, resetPassword, resetPasswordWithToken } = require('./main/login/login_backend');
const { handleRegister } = require('./main/register/register_backend');
const { getUserProfile } = require('./main/profil/profil_backend');
const { getClubs, joinClub, leaveClub, getClubDetails, initializeClubs } = require('./main/kulupler/kulupler_backend');
const { testConnection, getDb } = require('./db/config');
const uploadRoute = require('./server/routes/upload'); // Upload rotasını en başta tanımla
const adminRoutes = require('./server/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files - sıralama önemli
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/main', express.static(path.join(__dirname, 'main')));
app.use(express.static(path.join(__dirname)));
app.use('/api', uploadRoute); // Upload rotasını middleware'den sonra, API routelarından önce ekle
app.use('/api/admin', adminRoutes);

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

// Profil bilgilerini getirme endpoint'i
app.get('/api/profile', async (req, res) => {
    try {
        const userEmail = req.query.email;
        console.log('Profil isteği alındı, email:', userEmail);

        if (!userEmail) {
            console.log('E-posta adresi eksik');
            return res.status(400).json({ success: false, message: 'E-posta adresi gerekli' });
        }

        const result = await getUserProfile(userEmail);
        console.log('Profil sonucu:', result);
        res.json(result);
    } catch (error) {
        console.error('Profile API error:', error);
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

// Kullanıcı şifresini değiştirme endpoint'i
app.post('/api/user/change-password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'E-posta, mevcut şifre ve yeni şifre gereklidir.' 
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
        
        // Mevcut şifreyi kontrol et - doğrudan karşılaştırma yapılıyor
        if (user.password !== currentPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Mevcut şifre yanlış.' 
            });
        }
        
        // Şifreyi güncelle
        await usersCollection.updateOne(
            { email },
            { $set: { password: newPassword } }
        );
        
        console.log(`Kullanıcı şifresi güncellendi: ${email}`);
        
        res.json({ 
            success: true, 
            message: 'Şifreniz başarıyla değiştirildi.' 
        });
    } catch (error) {
        console.error('Şifre değiştirme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Şifre değiştirilirken bir hata oluştu.' 
        });
    }
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
    if (req.path.startsWith('/api/')) {
        return next(); // API isteklerinde HTML gönderme
    }
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
    console.log('- POST /api/upload');
}); 