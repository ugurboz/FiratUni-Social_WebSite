const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    icon: { type: String }
}, { timestamps: true });

ClubSchema.methods.addMember = async function(userId) {
    if (this.members.includes(userId)) {
        throw new Error('User is already a member of this club');
    }
    this.members.push(userId);
    await this.save();
};

ClubSchema.methods.removeMember = async function(userId) {
    const index = this.members.indexOf(userId);
    if (index === -1) {
        throw new Error('User is not a member of this club');
    }
    this.members.splice(index, 1);
    await this.save();
};

ClubSchema.methods.updateClub = async function(updates, userId) {
    if (this.president.toString() !== userId.toString()) {
        throw new Error('Only the club president can update club details');
    }
    
    Object.keys(updates).forEach(key => {
        if (key !== 'president' && key !== 'members') {
            this[key] = updates[key];
        }
    });
    
    await this.save();
};

ClubSchema.methods.deleteClub = async function(userId) {
    if (this.president.toString() !== userId.toString()) {
        throw new Error('Only the club president can delete the club');
    }
    await this.remove();
};

module.exports = mongoose.model('Club', ClubSchema); 