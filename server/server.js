require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB Atlas bağlantısı
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB Atlas bağlantısı başarılı');
}).catch((err) => {
    console.error('MongoDB bağlantı hatası:', err);
});

// Admin API route
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('API Çalışıyor');
});

app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
}); 