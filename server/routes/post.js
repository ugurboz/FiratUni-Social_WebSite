const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");

console.log('POST ROUTE YÜKLENDİ');

// Gönderi oluştur
router.post("/", async (req, res) => {
  try {
    const { email, content, image, video } = req.body;
    if (!email || (!content && !image && !video)) {
      return res.status(400).json({ error: "Boş gönderi paylaşılamaz." });
    }
    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    const newPost = await Post.create({
      userId: user._id,
      content,
      image,
      video
    });
    res.status(201).json({
      ...newPost.toObject(),
      username: user.firstName + ' ' + user.lastName,
      profilePicture: user.profilePicture
    });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Tüm gönderileri getir
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ timestamp: -1 });
    // Her gönderiye kullanıcı adını ve profil fotoğrafını ekle
    const postsWithUser = await Promise.all(posts.map(async post => {
      const user = await User.findById(post.userId);
      return {
        ...post.toObject(),
        username: user ? (user.firstName + ' ' + user.lastName) : "Anonim",
        profilePicture: user ? user.profilePicture : ""
      };
    }));
    res.json({ posts: postsWithUser });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;
