console.log('>>> admin.js dosyası yükleniyor...');

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Club = require('../models/Club');
const Event = require('../models/Event');
const Post = require('../models/Post');
const Activity = require('../models/Activity');
const Settings = require('../models/Settings');
const { authenticate } = require('../middleware/authMiddleware');
const admin = require('../middleware/admin');

console.log('server/routes/admin.js çalışıyor');

// Admin durumunu kontrol et
router.get('/check', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ isAdmin: user.role === 'admin' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Dashboard istatistikleri
router.get('/dashboard', authenticate, admin, async (req, res) => {
    try {
        const [usersCount, clubsCount, eventsCount, postsCount] = await Promise.all([
            User.countDocuments(),
            Club.countDocuments(),
            Event.countDocuments(),
            Post.countDocuments()
        ]);

        res.json({
            users: usersCount,
            clubs: clubsCount,
            events: eventsCount,
            posts: postsCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Son aktiviteler
router.get('/activities', authenticate, admin, async (req, res) => {
    try {
        const activities = await Activity.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('user', 'firstName lastName')
            .populate('club', 'name')
            .populate('event', 'title');

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Kullanıcı yönetimi
router.get('/users', authenticate, admin, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

router.post('/users', authenticate, admin, async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
        }

        user = new User({
            firstName,
            lastName,
            email,
            password,
            role: role || 'user'
        });

        await user.save();
        res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

router.put('/users/:id', authenticate, admin, async (req, res) => {
    try {
        const { firstName, lastName, email, role, isActive } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        user.role = role || user.role;
        user.isActive = isActive !== undefined ? isActive : user.isActive;

        await user.save();
        res.json({ message: 'Kullanıcı başarıyla güncellendi' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

router.delete('/users/:id', authenticate, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        await user.remove();
        res.json({ message: 'Kullanıcı başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Kulüp yönetimi
router.get('/clubs', authenticate, admin, async (req, res) => {
    try {
        const clubs = await Club.find()
            .populate('president', 'firstName lastName')
            .sort({ createdAt: -1 });
        res.json(clubs);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

router.post('/clubs', authenticate, admin, async (req, res) => {
    try {
        const { name, description, president, category } = req.body;

        let club = await Club.findOne({ name });
        if (club) {
            return res.status(400).json({ message: 'Bu isimde bir kulüp zaten var' });
        }

        club = new Club({
            name,
            description,
            president,
            category
        });

        await club.save();
        res.status(201).json({ message: 'Kulüp başarıyla oluşturuldu' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

router.put('/clubs/:id', authenticate, admin, async (req, res) => {
    try {
        const { name, description, president, category, isActive } = req.body;
        const club = await Club.findById(req.params.id);

        if (!club) {
            return res.status(404).json({ message: 'Kulüp bulunamadı' });
        }

        club.name = name || club.name;
        club.description = description || club.description;
        club.president = president || club.president;
        club.category = category || club.category;
        club.isActive = isActive !== undefined ? isActive : club.isActive;

        await club.save();
        res.json({ message: 'Kulüp başarıyla güncellendi' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

router.delete('/clubs/:id', authenticate, admin, async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) {
            return res.status(404).json({ message: 'Kulüp bulunamadı' });
        }

        await club.remove();
        res.json({ message: 'Kulüp başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Etkinlik yönetimi
router.get('/events', authenticate, admin, async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organizer', 'firstName lastName')
            .sort({ date: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

router.post('/events', authenticate, admin, async (req, res) => {
    try {
        const { title, description, date, location, organizer, club } = req.body;

        const event = new Event({
            title,
            description,
            date,
            location,
            organizer,
            club
        });

        await event.save();
        res.status(201).json({ message: 'Etkinlik başarıyla oluşturuldu' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

router.put('/events/:id', authenticate, admin, async (req, res) => {
    try {
        const { title, description, date, location, organizer, club, status } = req.body;
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Etkinlik bulunamadı' });
        }

        event.title = title || event.title;
        event.description = description || event.description;
        event.date = date || event.date;
        event.location = location || event.location;
        event.organizer = organizer || event.organizer;
        event.club = club || event.club;
        event.status = status || event.status;

        await event.save();
        res.json({ message: 'Etkinlik başarıyla güncellendi' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

router.delete('/events/:id', authenticate, admin, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Etkinlik bulunamadı' });
        }

        await event.remove();
        res.json({ message: 'Etkinlik başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Sistem ayarları
router.get('/settings', authenticate, admin, async (req, res) => {
    try {
        const settings = await Settings.findOne();
        res.json(settings || {});
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

router.put('/settings', authenticate, admin, async (req, res) => {
    try {
        const { siteName, siteDescription, maintenanceMode } = req.body;
        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings();
        }

        settings.siteName = siteName || settings.siteName;
        settings.siteDescription = siteDescription || settings.siteDescription;
        settings.maintenanceMode = maintenanceMode !== undefined ? maintenanceMode : settings.maintenanceMode;

        await settings.save();
        res.json({ message: 'Ayarlar başarıyla güncellendi' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

module.exports = router; 