const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    icon: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Club', ClubSchema); 