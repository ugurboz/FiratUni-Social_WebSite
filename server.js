const express = require('express');
const cors = require('cors');
const path = require('path');
const { loginUser, resetPassword, resetPasswordWithToken } = require('./main/login/login_backend');
const { handleRegister } = require('./main/register/register_backend');
const { getUserProfile } = require('./main/profil/profil_backend');
const { getClubs, joinClub, leaveClub, getClubDetails, initializeClubs } = require('./main/kulupler/kulupler_backend');
const { testConnection, getDb } = require('./db/config');
const uploadRoute = require('./server/routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (Sıralama önemli: Body parser ve CORS en başta olmalı)
app.use(express.json());
app.use(cors());

// *********** API ROUTES ***********
// Tüm API rotaları statik dosya sunumundan önce gelmeli

// Login endpoint'i
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

// Şifre sıfırlama isteği endpoint'i
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

// Token ile şifre sıfırlama endpoint'i
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

// Kayıt endpoint'i
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

// Posts endpoint'i (GET)
app.get('/api/posts', async (req, res) => {
    try {
        const db = await getDb();
        const postsCollection = db.collection('posts');
        const posts = await postsCollection.find({}).toArray();
        res.json({ success: true, posts: posts });
    } catch (error) {
        console.error('Posts getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Gönderiler alınırken bir hata oluştu' });
    }
});

// Post oluşturma endpoint'i (POST)
app.post('/api/posts', async (req, res) => {
    try {
        const { email, content, image } = req.body;
        
        if (!email || !content) {
            return res.status(400).json({ 
                success: false, 
                message: 'E-posta ve içerik gereklidir' 
            });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ email });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kullanıcı bulunamadı' 
            });
        }

        const postsCollection = db.collection('posts');
        const newPost = {
            email,
            username: user.username || user.firstName + ' ' + user.lastName,
            content,
            image,
            timestamp: new Date().toISOString(),
            likes: 0,
            comments: []
        };

        const result = await postsCollection.insertOne(newPost);
        res.json({ 
            success: true, 
            message: 'Gönderi başarıyla oluşturuldu',
            post: { ...newPost, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Post oluşturma hatası:', error);
        res.status(500).json({ success: false, message: 'Gönderi oluşturulurken bir hata oluştu' });
    }
});

// Admin giriş kontrolü endpoint'i
app.get('/api/admin/check', async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'E-posta adresi gereklidir',
                isAdmin: false 
            });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');
        
        // Kullanıcıyı bul ve admin yetkisini kontrol et
        const user = await usersCollection.findOne({ email });
        
        if (!user) {
            return res.json({ 
                success: false, 
                message: 'Kullanıcı bulunamadı',
                isAdmin: false 
            });
        }

        // Admin kontrolü - user'da isAdmin field'ı var mı kontrol et
        const isAdmin = user.isAdmin === true || user.role === 'admin';
        
        console.log(`Admin kontrolü - Email: ${email}, Admin: ${isAdmin}`);
        
        res.json({ 
            success: true, 
            isAdmin: isAdmin,
            message: isAdmin ? 'Admin yetkisi doğrulandı' : 'Admin yetkisi yok'
        });
    } catch (error) {
        console.error('Admin check API error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Bir hata oluştu',
            isAdmin: false 
        });
    }
});

// Admin dashboard endpoint'i
app.get('/api/admin/dashboard', async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'E-posta adresi gereklidir' 
            });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');
        
        // Admin yetkisini tekrar kontrol et
        const user = await usersCollection.findOne({ email });
        
        if (!user || (user.isAdmin !== true && user.role !== 'admin')) {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin yetkisi gereklidir' 
            });
        }

        // Admin dashboard verilerini hazırla
        const totalUsers = await usersCollection.countDocuments();
        const postsCollection = db.collection('posts');
        const totalPosts = await postsCollection.countDocuments();
        const clubsCollection = db.collection('clubs');
        const totalClubs = await clubsCollection.countDocuments();

        const dashboardData = {
            totalUsers,
            totalPosts, 
            totalClubs,
            recentUsers: await usersCollection.find({}).limit(5).toArray(),
            recentPosts: await postsCollection.find({}).limit(5).toArray()
        };

        console.log(`Admin dashboard verileri gönderildi - ${email}`);
        
        res.json({ 
            success: true, 
            data: dashboardData
        });
    } catch (error) {
        console.error('Admin dashboard API error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Dashboard verileri alınırken bir hata oluştu' 
        });
    }
});

// Admin kullanıcısı oluşturma endpoint'i
app.post('/api/admin/create-admin', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'E-posta adresi gereklidir' 
            });
        }

        const db = await getDb();
        const usersCollection = db.collection('users');
        
        // Kullanıcıyı admin yap
        const result = await usersCollection.updateOne(
            { email },
            { $set: { isAdmin: true, role: 'admin' } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kullanıcı bulunamadı' 
            });
        }

        console.log(`Kullanıcı admin yapıldı: ${email}`);
        
        res.json({ 
            success: true, 
            message: 'Kullanıcı admin yetkisi aldı' 
        });
    } catch (error) {
        console.error('Admin oluşturma hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Admin oluşturulurken bir hata oluştu' 
        });
    }
});

// Admin kullanıcıları listeleme endpoint'i
app.get('/api/admin/users', async (req, res) => {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');
        const users = await usersCollection.find({}).toArray();
        
        // Şifreleri gizle
        const sanitizedUsers = users.map(user => {
            const { password, ...userData } = user;
            return userData;
        });
        
        res.json(sanitizedUsers);
    } catch (error) {
        console.error('Kullanıcılar listelenirken hata:', error);
        res.status(500).json({ success: false, message: 'Kullanıcılar listelenirken bir hata oluştu' });
    }
});

// Admin aktiviteleri listeleme endpoint'i
app.get('/api/admin/activities', async (req, res) => {
    try {
        const db = await getDb();
        // 'activities' koleksiyonu yoksa oluşturulacak varsayılarak devam ediliyor
        const activitiesCollection = db.collection('activities');
        const activities = await activitiesCollection.find({})
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();
        
        res.json(activities);
    } catch (error) {
        console.error('Aktiviteler listelenirken hata:', error);
        res.status(500).json({ success: false, message: 'Aktiviteler listelenirken bir hata oluştu' });
    }
});

// Admin etkinlikleri listeleme endpoint'i
app.get('/api/admin/events', async (req, res) => {
    try {
        const db = await getDb();
        // 'events' koleksiyonu yoksa oluşturulacak varsayılarak devam ediliyor
        const eventsCollection = db.collection('events');
        const events = await eventsCollection.find({}).toArray();
        
        res.json(events);
    } catch (error) {
        console.error('Etkinlikler listelenirken hata:', error);
        res.status(500).json({ success: false, message: 'Etkinlikler listelenirken bir hata oluştu' });
    }
});

// Admin kulüpleri listeleme endpoint'i (Düzeltildi)
app.get('/api/admin/clubs', async (req, res) => {
    try {
        const db = await getDb();
        const clubsCollection = db.collection('clubs');
        const clubs = await clubsCollection.find({}).toArray();
        res.json(clubs);
    } catch (error) {
        console.error('Kulüpler listelenirken hata:', error);
        res.status(500).json({ success: false, message: 'Kulüpler listelenirken bir hata oluştu' });
    }
});

// Admin ayarları getirme endpoint'i
app.get('/api/admin/settings', async (req, res) => {
    try {
        const db = await getDb();
        // 'settings' koleksiyonu yoksa oluşturulacak varsayılarak devam ediliyor
        const settingsCollection = db.collection('settings');
        const settings = await settingsCollection.findOne({}) || {
            siteName: 'Fırat Üniversitesi Sosyal Platform',
            siteDescription: '',
            maintenanceMode: false
        };
        
        res.json(settings);
    } catch (error) {
        console.error('Ayarlar getirilirken hata:', error);
        res.status(500).json({ success: false, message: 'Ayarlar getirilirken bir hata oluştu' });
    }
});

// Admin ayarları güncelleme endpoint'i
app.put('/api/admin/settings', async (req, res) => {
    try {
        const { siteName, siteDescription, maintenanceMode } = req.body;
        
        const db = await getDb();
        const settingsCollection = db.collection('settings');
        
        await settingsCollection.updateOne(
            {},
            { $set: { siteName, siteDescription, maintenanceMode } },
            { upsert: true }
        );
        
        res.json({ success: true, message: 'Ayarlar başarıyla güncellendi' });
    } catch (error) {
        console.error('Ayarlar güncellenirken hata:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ayarlar güncellenirken bir hata oluştu' 
        });
    }
});

// Veritabanı içeriğini görmek için geliştirici endpoint'i (Debug)
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

// Upload rotasını tüm açık /api rotalarından sonra ekleyin
app.use('/api', uploadRoute);

// *********** STATİK DOSYA SUNUMU VE SAYFA ROTLARI ***********

// Serve static files - Tüm API rotalarından sonra, ancak sayfa rotalarından önce gelmeli
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/main', express.static(path.join(__dirname, 'main')));

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

// Kök dizini statik olarak sunan middleware'i en sona taşıdık, belirli sayfa rotalarından sonra.
app.use(express.static(path.join(__dirname)));

// SPA-style route handler - Client-side routing için
// Bu rota, yukarıdaki belirli rotalar ve statik dosyalarla eşleşmeyen GET isteklerini yakalar
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        // API istekleri buraya düşmemeli, ancak düşerse devam et
        return next();
    }
    if (req.accepts('html')) {
        // Eğer istek bir HTML sayfası bekliyorsa, anasayfa HTML dosyasını gönder
        res.sendFile(path.join(__dirname, 'main', 'anasayfa', 'anasayfa_screen.html'), (err) => {
            if (err) {
                console.error('Error sending SPA fallback page:', err);
                // Eğer anasayfa bulunamazsa 404 gönder
                res.status(404).sendFile(path.join(__dirname, 'main', '404.html'));
            }
        });
    } else {
        // HTML dışında bir şey isteniyorsa (css, js, resim vb.), sonraki middleware'e geç (muhtemelen 404)
        next();
    }
});

// Error handler for file not found (Bu middleware SPA fallback'inden sonra gelmeli)
app.use((req, res, next) => {
    const filePath = path.join(__dirname, req.path);
    console.log('Requested path:', req.path);
    console.log('Attempted file path:', filePath);
    next(); // Devam et, muhtemelen 404 handler'a düşecek
});

// Error handler for 404 - Page Not Found (En sonda olmalı)
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
    console.log('Available API routes:');
    console.log('- POST /api/login');
    console.log('- POST /api/register');
    console.log('- POST /api/reset-password');
    console.log('- POST /api/reset-password-with-token');
    console.log('- GET  /api/profile');
    console.log('- GET  /api/posts');
    console.log('- POST /api/posts');
    console.log('- GET  /api/admin/check');
    console.log('- GET  /api/admin/dashboard');
    console.log('- POST /api/admin/create-admin');
    console.log('- GET  /api/admin/users');
    console.log('- GET  /api/admin/activities');
    console.log('- GET  /api/admin/events');
    console.log('- GET  /api/admin/settings');
    console.log('- PUT  /api/admin/settings');
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

    console.log('\nAvailable Page routes:');
    console.log('- GET  /');
    console.log('- GET  /login');
    console.log('- GET  /register');
    console.log('- GET  /reset-password');
    console.log('- GET  /anasayfa');
});