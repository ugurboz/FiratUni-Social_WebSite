const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String },
    description: { type: String },
    category: { type: String },
    status: { type: String, default: 'active' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxParticipants: { type: Number },
    progress: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema); 