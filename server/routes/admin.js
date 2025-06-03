const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getDb } = require('../../db/config');

// Admin middleware - email kontrolü
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user || !user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Admin yetkisi gerekli' });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
};

// Admin giriş kontrolü
router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
        }

        if (!user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Admin yetkisi gerekli' });
        }

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Admin dashboard istatistikleri
router.get('/stats', isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeEvents = await Event.countDocuments({ status: 'active' });
        const totalClubs = await Club.countDocuments();

        res.json({
            success: true,
            stats: {
                totalUsers,
                activeEvents,
                totalClubs
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Admin durumunu kontrol et
router.get('/check-status', authenticate, async (req, res) => {
    try {
        const userEmail = req.query.email;
        if (!userEmail) {
            return res.json({ success: false, isAdmin: false, message: 'Email parametresi gerekli' });
        }
        const db = await getDb();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ email: userEmail });
        if (!user) {
            return res.json({ success: false, isAdmin: false, message: 'Kullanıcı bulunamadı' });
        }
        // Özel email kontrolü
        if (userEmail === '235541006@firat.edu.tr') {
            await usersCollection.updateOne({ email: userEmail }, { $set: { isAdmin: true } });
            user.isAdmin = true;
        }
        res.json({
            success: true,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        console.error('Admin status check error:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Diğer admin route'ları buraya eklenecek...

module.exports = router; 