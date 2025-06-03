const express = require("express");
const router = express.Router();

let posts = []; // Gerçek projede MongoDB kullanılmalı

router.post("/posts", (req, res) => {
    const { username, content, image, video, timestamp } = req.body;

    if (!username || (!content && !image && !video)) {
        return res.status(400).json({ error: "Boş gönderi paylaşılamaz." });
    }

    const newPost = {
        id: posts.length + 1,
        username,
        content,
        image,
        video,
        likes: 0,
        comments: [],
        timestamp
    };

    posts.unshift(newPost);
    res.status(201).json(newPost);
});

module.exports = router;
