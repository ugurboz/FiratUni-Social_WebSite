const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Bu sayfaya erişim yetkiniz bulunmamaktadır' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
}; 