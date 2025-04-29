const express = require('express');
const cors = require('cors');
const path = require('path');
const { loginUser } = require('./main/login/login_backend');
const { handleRegister } = require('./main/register/register_backend');
const { getUserProfile } = require('./main/profil/profil_backend');
const { getClubs, joinClub, leaveClub, getClubDetails, initializeClubs } = require('./main/kulupler/kulupler_backend');
const { testConnection, getDb, initializeTestData } = require('./db/config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files - sıralama önemli
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/main', express.static(path.join(__dirname, 'main')));
app.use(express.static(path.join(__dirname)));

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

// Start the server
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Test verilerini oluştur
    await initializeTestData();
    await initializeClubs();
    
    // Log the available routes
    console.log('Available routes:');
    console.log('- GET  /', path.join(__dirname, 'main', 'anasayfa', 'anasayfa_screen.html'));
    console.log('- GET  /login', path.join(__dirname, 'main', 'login', 'login_screen.html'));
    console.log('- GET  /register', path.join(__dirname, 'main', 'register', 'register_screen.html'));
    console.log('- GET  /anasayfa', path.join(__dirname, 'main', 'anasayfa', 'anasayfa_screen.html'));
    console.log('- POST /api/login');
    console.log('- POST /api/register');
    console.log('- GET  /api/profile');
    console.log('- GET  /api/debug/users');
    console.log('- GET  /api/clubs');
    console.log('- GET  /api/clubs/:clubId');
    console.log('- POST /join-club');
    console.log('- POST /leave-club');
}); 