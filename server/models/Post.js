const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: String,
  image: String,
  video: String,
  likes: { type: Number, default: 0 },
  comments: [
    {
      username: String,
      content: String,
      timestamp: Date
    }
  ],
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema); 