const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Profil güncelleme
router.put('/profile', async (req, res) => {
    try {
        const { userId, updates } = req.body;

        // Kullanıcıyı bul ve güncelle
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Hassas bilgileri çıkar
        const { password, ...userWithoutPassword } = user.toObject();
        
        res.json({
            message: 'Profil başarıyla güncellendi',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        res.status(500).json({ message: 'Profil güncellenirken bir hata oluştu' });
    }
});

module.exports = router; 