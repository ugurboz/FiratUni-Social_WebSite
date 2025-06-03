const { getDb } = require('./config');

async function updateUsersWithAdminField() {
    try {
        const db = await getDb();
        const collection = db.collection('users');
        
        // Tüm kullanıcıları bul ve isAdmin alanını ekle
        const result = await collection.updateMany(
            { isAdmin: { $exists: false } }, // isAdmin alanı olmayan kullanıcıları bul
            { $set: { isAdmin: false } } // isAdmin alanını false olarak ekle
        );
        
        console.log(`${result.modifiedCount} kullanıcı güncellendi.`);
        
        // Örnek olarak bir kullanıcıyı admin yap
        const adminResult = await collection.updateOne(
            { email: "235541006@firat.edu.tr" }, // Admin yapmak istediğiniz email
            { $set: { isAdmin: true } }
        );
        
        if (adminResult.modifiedCount > 0) {
            console.log('Admin kullanıcı başarıyla güncellendi.');
        } else {
            console.log('Admin kullanıcı bulunamadı veya zaten admin.');
        }
        
    } catch (error) {
        console.error('Güncelleme hatası:', error);
    } finally {
        process.exit();
    }
}

// Scripti çalıştır
updateUsersWithAdminField(); 