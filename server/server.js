require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clubRoutes = require('./routes/clubs');
const eventRoutes = require('./routes/events');
const messageRoutes = require('./routes/messages');
const postRoutes = require('./routes/posts');
const uploadRoutes = require('./routes/upload');

console.log('server.js çalıştırıldığı dizin:', __dirname);

let adminRoutes;
try {
    const adminRoutePath = require.resolve('./routes/admin');
    console.log('./routes/admin çözümlenen yol:', adminRoutePath);
    adminRoutes = require(adminRoutePath);
    console.log('server.js - adminRoutes başarıyla require edildi');
} catch (error) {
    console.error('server.js - adminRoutes require hatası:', error);
}

console.log('server.js - adminRoutes değeri:', adminRoutes);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Atlas bağlantısı
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB Atlas bağlantısı başarılı');
}).catch((err) => {
    console.error('MongoDB bağlantı hatası:', err);
});

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/upload', uploadRoutes);

// Statik dosya servisi
app.use(express.static(path.join(__dirname, '..')));

// Ana sayfa
app.get('/', (req, res) => {
    res.send('API Çalışıyor');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Bir hata oluştu' });
});

app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
}); 