// upload.js (route dosyası)
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload"); // ✅ DOĞRU YOL

// Tek görsel yükleme (form field adı: 'image')
router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Dosya yüklenemedi" });
  }

  // Dosya başarıyla yüklendi
  res.status(200).json({
    message: "Dosya başarıyla yüklendi",
    imageUrl: req.file.location, // S3'teki URL
  });
});

module.exports = router;
