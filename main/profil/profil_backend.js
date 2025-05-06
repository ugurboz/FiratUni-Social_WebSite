// Profil backend işlevleri
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { getDb } = require('../../db/config'); // DB bağlantısı için

// Veritabanından kullanıcı profilini getir
async function getUserProfile(email) {
    try {
        console.log('getUserProfile çağrıldı, email:', email);
        const db = await getDb();
        const usersCollection = db.collection('users');

        // E-posta ile kullanıcıyı bul
        const user = await usersCollection.findOne({ email: email });
        console.log('Bulunan kullanıcı:', user);

        if (!user) {
            console.log('Kullanıcı bulunamadı');
            return { success: false, message: "Kullanıcı bulunamadı" };
        }

        // Şifreyi hariç tut
        const { password, ...userProfile } = user;

        // Kulüp bilgilerini getir
        if (userProfile.clubs && userProfile.clubs.length > 0) {
            const clubsCollection = db.collection('clubs');
            const clubDetails = await clubsCollection.find({ 
                name: { $in: userProfile.clubs } 
            }).toArray();
            userProfile.clubDetails = clubDetails;
        }

        console.log('Döndürülen profil:', userProfile);
        return {
            success: true,
            user: userProfile
        };

    } catch (error) {
        console.error("Profil bilgileri getirme hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    }
}

// Kullanıcı profil bilgilerini güncelle
async function updateUserProfile(email, userData) {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');

        // Güncellenebilir alanlar
        const updatableFields = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            department: userData.department,
            year: userData.year
        };

        // Boş değerleri temizle
        Object.keys(updatableFields).forEach(key => {
            if (!updatableFields[key]) delete updatableFields[key];
        });

        // Kullanıcıyı güncelle
        const result = await usersCollection.updateOne(
            { email: email },
            { $set: updatableFields }
        );

        if (result.modifiedCount === 0) {
            return { success: false, message: "Kullanıcı bulunamadı veya güncelleme yapılmadı" };
        }

        return {
            success: true,
            message: "Profil başarıyla güncellendi"
        };

    } catch (error) {
        console.error("Profil güncelleme hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    }
}

// Kulübe katıl
async function joinClub(email, clubName) {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');
        const clubsCollection = db.collection('clubs');

        // Kulübün var olup olmadığını kontrol et
        const club = await clubsCollection.findOne({ name: clubName });
        if (!club) {
            return { success: false, message: "Kulüp bulunamadı" };
        }

        // Kullanıcıyı bul
        const user = await usersCollection.findOne({ email: email });
        if (!user) {
            return { success: false, message: "Kullanıcı bulunamadı" };
        }

        // Kullanıcı zaten kulüpte mi kontrol et
        if (user.clubs && user.clubs.includes(clubName)) {
            return { success: false, message: "Zaten bu kulübün üyesisiniz" };
        }

        // Kullanıcıyı kulübe ekle
        await usersCollection.updateOne(
            { email: email },
            { $push: { clubs: clubName } }
        );

        // Kulüp üyelerine kullanıcıyı ekle
        await clubsCollection.updateOne(
            { name: clubName },
            { $push: { members: email } }
        );

        return { success: true, message: "Kulübe başarıyla katıldınız" };
    } catch (error) {
        console.error("Kulübe katılma hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    }
}

// Kulüpten ayrıl
async function leaveClub(email, clubName) {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');
        const clubsCollection = db.collection('clubs');

        // Kullanıcıyı bul
        const user = await usersCollection.findOne({ email: email });
        if (!user) {
            return { success: false, message: "Kullanıcı bulunamadı" };
        }

        // Kullanıcı kulüpte mi kontrol et
        if (!user.clubs || !user.clubs.includes(clubName)) {
            return { success: false, message: "Bu kulübün üyesi değilsiniz" };
        }

        // Kullanıcıyı kulüpten çıkar
        await usersCollection.updateOne(
            { email: email },
            { $pull: { clubs: clubName } }
        );

        // Kulüp üyelerinden kullanıcıyı çıkar
        await clubsCollection.updateOne(
            { name: clubName },
            { $pull: { members: email } }
        );

        return { success: true, message: "Kulüpten başarıyla ayrıldınız" };
    } catch (error) {
        console.error("Kulüpten ayrılma hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    }
}

// Kullanıcının kulüplerini getir
async function getUserClubs(email) {
    try {
        const db = await getDb();
        const usersCollection = db.collection('users');

        // Kullanıcıyı bul
        const user = await usersCollection.findOne({ email: email });
        if (!user) {
            return { success: false, message: "Kullanıcı bulunamadı" };
        }

        // Kullanıcının kulüplerini getir
        const clubsCollection = db.collection('clubs');
        const clubs = await clubsCollection.find({
            name: { $in: user.clubs || [] }
        }).toArray();

        return {
            success: true,
            clubs: clubs
        };
    } catch (error) {
        console.error("Kulüpleri getirme hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    }
}

module.exports = {
    getUserProfile,
    updateUserProfile,
    joinClub,
    leaveClub,
    getUserClubs
}; 