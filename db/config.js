const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB bağlantı URI'si
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firatuni_social';
console.log('MongoDB URI:', uri); // URI'yi göster (hassas bilgileri gizleyin)

// MongoDB bağlantısı için promise
let dbConnection;

// MongoDB bağlantısı
mongoose.connect(uri)
  .then(() => {
    console.log('MongoDB Atlas\'a başarıyla bağlandı.');
    dbConnection = mongoose.connection.db;
  })
  .catch(err => {
    console.error('MongoDB bağlantı hatası (detaylı):', err);
  });

// getDb fonksiyonu - var olan kodlar bu fonksiyonu kullanıyor
async function getDb() {
  if (!dbConnection) {
    console.log('dbConnection henüz oluşturulmamış, bağlantı bekleniyor...');
    await new Promise(resolve => {
      const checkConnection = () => {
        console.log('Bağlantı durumu kontrol ediliyor:', mongoose.connection.readyState);
        if (mongoose.connection.readyState === 1) {
          console.log('Bağlantı başarılı, dbConnection oluşturuluyor');
          dbConnection = mongoose.connection.db;
          resolve();
        } else {
          console.log('Bağlantı henüz hazır değil, 100ms sonra tekrar denenecek');
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }
  return dbConnection;
}

// Test fonksiyonu
async function testConnection() {
  try {
    const db = await getDb();
    console.log('Veritabanı bağlantısı test ediliyor...');
    const collections = await db.listCollections().toArray();
    console.log('Mevcut koleksiyonlar:', collections.map(c => c.name));
    return true;
  } catch (error) {
    console.error('Veritabanı test hatası:', error);
    return false;
  }
}

module.exports = {
  getDb,
  testConnection
}; 