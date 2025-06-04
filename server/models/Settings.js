const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    siteName: {
        type: String,
        default: 'Fırat Üniversitesi Sosyal Platform'
    },
    siteDescription: {
        type: String,
        default: 'Fırat Üniversitesi öğrencileri için sosyal platform'
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Settings', settingsSchema); 