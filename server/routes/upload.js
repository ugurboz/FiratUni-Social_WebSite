// upload.js (route dosyası)
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload"); // ✅ DOĞRU YOL

// Tek görsel yükleme (form field adı: 'image')
router.post("/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Dosya yüklenemedi" });
    }

    console.log("Dosya başarıyla yüklendi:", req.file);
    
    // Dosya başarıyla yüklendi
    res.status(200).json({
      message: "Dosya başarıyla yüklendi",
      imageUrl: req.file.location // S3'teki URL
    });
  } catch (error) {
    console.error("Dosya yükleme hatası:", error);
    res.status(500).json({ 
      error: "Dosya yüklenirken bir hata oluştu", 
      message: error.message 
    });
  }
});

module.exports = router;
