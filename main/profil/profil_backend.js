// Profil backend işlevleri

// Örnek kullanıcı veritabanı
const usersDB = {
    'admin': {
        username: 'admin',
        email: 'admin@firat.edu.tr',
        phone: '+90 555 123 4567',
        department: 'Yazılım Mühendisliği',
        joinDate: '01.09.2023',
        stats: {
            posts: 150,
            followers: 500,
            following: 300
        },
        clubs: ['Yazılım Kulübü', 'Robotik Kulübü']
    }
};

// Profil bilgilerini getirme fonksiyonu
async function getProfile(username) {
    return new Promise((resolve, reject) => {
        try {
            const user = usersDB[username];
            if (user) {
                resolve(user);
            } else {
                reject(new Error('Kullanıcı bulunamadı'));
            }
        } catch (error) {
            reject(error);
        }
    });
}

// Profil güncelleme fonksiyonu
async function updateProfile(username, updates) {
    return new Promise((resolve, reject) => {
        try {
            if (!usersDB[username]) {
                reject(new Error('Kullanıcı bulunamadı'));
                return;
            }

            // Güncellemeleri uygula
            Object.keys(updates).forEach(key => {
                if (key in usersDB[username]) {
                    usersDB[username][key] = updates[key];
                }
            });

            resolve(usersDB[username]);
        } catch (error) {
            reject(error);
        }
    });
}

// Kulüp ekleme fonksiyonu
async function joinClub(username, clubName) {
    return new Promise((resolve, reject) => {
        try {
            if (!usersDB[username]) {
                reject(new Error('Kullanıcı bulunamadı'));
                return;
            }

            if (!usersDB[username].clubs.includes(clubName)) {
                usersDB[username].clubs.push(clubName);
            }

            resolve(usersDB[username].clubs);
        } catch (error) {
            reject(error);
        }
    });
}

// Kulüp çıkma fonksiyonu
async function leaveClub(username, clubName) {
    return new Promise((resolve, reject) => {
        try {
            if (!usersDB[username]) {
                reject(new Error('Kullanıcı bulunamadı'));
                return;
            }

            usersDB[username].clubs = usersDB[username].clubs.filter(club => club !== clubName);
            resolve(usersDB[username].clubs);
        } catch (error) {
            reject(error);
        }
    });
}

// Oturum kontrolü
async function checkSession() {
    return new Promise((resolve) => {
        const token = localStorage.getItem('authToken');
        resolve(!!token);
    });
}

// Çıkış yapma fonksiyonu
async function handleLogout() {
    return new Promise((resolve) => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        resolve(true);
    });
} 