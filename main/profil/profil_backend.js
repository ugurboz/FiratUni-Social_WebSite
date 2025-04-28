// Profil backend işlevleri
const { MongoClient, ServerApiVersion } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const uri = process.env.MONGODB_URI;
const dbName = "firatuni_social";

// Veritabanından kullanıcı profilini getir
async function getUserProfile(email) {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();
        const database = client.db(dbName);
        const users = database.collection("users");

        // E-posta ile kullanıcıyı bul
        const user = await users.findOne(
            { email: email },
            { projection: {
                password: 0, // Şifreyi hariç tut
                _id: 0 // ID'yi hariç tut
            }}
        );

        if (!user) {
            return { success: false, message: "Kullanıcı bulunamadı" };
        }

        return {
            success: true,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                studentNumber: user.studentNumber,
                department: user.department,
                year: user.year,
                createdAt: user.createdAt
            }
        };

    } catch (error) {
        console.error("Profil bilgileri getirme hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    } finally {
        await client.close();
    }
}

// Kullanıcı profil bilgilerini güncelle
async function updateUserProfile(email, userData) {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();
        const database = client.db(dbName);
        const users = database.collection("users");

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
        const result = await users.updateOne(
            { email: email },
            { $set: { ...updatableFields, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return { success: false, message: "Kullanıcı bulunamadı" };
        }

        return {
            success: true,
            message: "Profil başarıyla güncellendi"
        };

    } catch (error) {
        console.error("Profil güncelleme hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    } finally {
        await client.close();
    }
}

// Kulüp üyelik işlemleri
async function joinClub(email, clubName) {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();
        const database = client.db(dbName);
        const users = database.collection("users");

        const result = await users.updateOne(
            { email: email },
            { $addToSet: { clubs: clubName } }
        );

        if (result.matchedCount === 0) {
            return { success: false, message: "Kullanıcı bulunamadı" };
        }

        return { success: true, message: "Kulübe başarıyla katıldınız" };
    } catch (error) {
        console.error("Kulübe katılma hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    } finally {
        await client.close();
    }
}

async function leaveClub(email, clubName) {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();
        const database = client.db(dbName);
        const users = database.collection("users");

        const result = await users.updateOne(
            { email: email },
            { $pull: { clubs: clubName } }
        );

        if (result.matchedCount === 0) {
            return { success: false, message: "Kullanıcı bulunamadı" };
        }

        return { success: true, message: "Kulüpten başarıyla ayrıldınız" };
    } catch (error) {
        console.error("Kulüpten ayrılma hatası:", error);
        return { success: false, message: "Bir hata oluştu" };
    } finally {
        await client.close();
    }
}

module.exports = {
    getUserProfile,
    updateUserProfile,
    joinClub,
    leaveClub
}; 