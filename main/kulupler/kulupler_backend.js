const { getDb } = require('../../db/config');

// Kulüpleri getir
async function getClubs() {
    try {
        const db = await getDb();
        const clubsCollection = db.collection('clubs');
        const clubs = await clubsCollection.find({}).toArray();
        return { success: true, clubs: clubs };
    } catch (error) {
        console.error('Kulüpler getirilirken hata:', error);
        return { success: false, message: 'Kulüpler getirilirken bir hata oluştu' };
    }
}

// Kulüp detaylarını getir
async function getClubDetails(clubId) {
    try {
        const db = await getDb();
        const clubsCollection = db.collection('clubs');
        const club = await clubsCollection.findOne({ name: clubId });
        
        if (!club) {
            return { success: false, message: 'Kulüp bulunamadı' };
        }

        return { success: true, club: club };
    } catch (error) {
        console.error('Kulüp detayları getirilirken hata:', error);
        return { success: false, message: 'Kulüp detayları getirilirken bir hata oluştu' };
    }
}

// Kulübe üye ol
async function joinClub(clubName, email) {
    const db = await getDb();
    try {
        // Kulübü bul
        const club = await db.collection('clubs').findOne({ name: clubName });
        if (!club) {
            return { success: false, message: 'Kulüp bulunamadı' };
        }

        // Kullanıcıyı bul
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return { success: false, message: 'Kullanıcı bulunamadı' };
        }

        // Kullanıcı zaten üye mi kontrol et
        if (club.members && club.members.includes(email)) {
            return { success: false, message: 'Zaten bu kulübe üyesiniz' };
        }

        // Kulübe üye ekle
        await db.collection('clubs').updateOne(
            { name: clubName },
            { $addToSet: { members: email } }
        );

        // Kullanıcının kulüpler listesine ekle
        await db.collection('users').updateOne(
            { email },
            { $addToSet: { clubs: clubName } }
        );

        return { success: true, message: 'Kulübe başarıyla katıldınız' };
    } catch (error) {
        console.error('Kulübe katılma hatası:', error);
        return { success: false, message: 'Kulübe katılırken bir hata oluştu' };
    }
}

// Kulüpten ayrıl
async function leaveClub(clubName, email) {
    const db = await getDb();
    try {
        // Kulübü bul
        const club = await db.collection('clubs').findOne({ name: clubName });
        if (!club) {
            return { success: false, message: 'Kulüp bulunamadı' };
        }

        // Kullanıcıyı bul
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return { success: false, message: 'Kullanıcı bulunamadı' };
        }

        // Kulüp üyeliğini kontrol et
        if (!club.members || !club.members.includes(email)) {
            return { success: false, message: 'Bu kulübe üye değilsiniz' };
        }

        // Kulüpten üyeliği kaldır
        await db.collection('clubs').updateOne(
            { name: clubName },
            { $pull: { members: email } }
        );

        // Kullanıcının kulüpler listesinden kaldır
        await db.collection('users').updateOne(
            { email },
            { $pull: { clubs: clubName } }
        );

        return { success: true, message: 'Kulüpten başarıyla ayrıldınız' };
    } catch (error) {
        console.error('Kulüpten ayrılma hatası:', error);
        return { success: false, message: 'Kulüpten ayrılırken bir hata oluştu' };
    }
}

// Test verilerini oluştur
async function initializeClubs() {
    try {
        const db = await getDb();
        const clubsCollection = db.collection('clubs');

        // Test verileri
        const testClubs = [
            {
                name: 'Yazılım Kulübü',
                description: 'Yazılım geliştirme ve teknoloji konularında çalışmalar yapan kulüp.',
                members: [],
                events: [],
                icon: 'fa-code'
            },
            {
                name: 'Robotik Kulübü',
                description: 'Robotik ve yapay zeka projeleri üzerine çalışan kulüp.',
                members: [],
                events: [],
                icon: 'fa-robot'
            },
            {
                name: 'Müzik Kulübü',
                description: 'Müzik ve sanat etkinlikleri düzenleyen kulüp.',
                members: [],
                events: [],
                icon: 'fa-music'
            }
        ];

        // Test verilerini ekle
        for (const club of testClubs) {
            const existingClub = await clubsCollection.findOne({ name: club.name });
            if (!existingClub) {
                await clubsCollection.insertOne(club);
            }
        }

        console.log('Kulüp test verileri başarıyla oluşturuldu');
    } catch (error) {
        console.error('Kulüp test verileri oluşturulurken hata:', error);
    }
}

module.exports = {
    getClubs,
    getClubDetails,
    joinClub,
    leaveClub,
    initializeClubs
}; 