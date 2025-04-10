// Kayıt backend işlevleri

// Kullanıcı veritabanı
const usersDB = {
    'admin': {
        username: 'admin',
        email: 'admin@firat.edu.tr',
        password: 'admin',
        joinDate: new Date().toISOString()
    }
};

// Kayıt işlemi
function handleRegister(firstName, lastName, password, email) {
    return new Promise((resolve, reject) => {
        // E-posta kontrolü
        if (usersDB[email]) {
            reject({
                success: false,
                message: 'Bu e-posta adresi zaten kullanılıyor!'
            });
            return;
        }

        // Yeni kullanıcı oluştur
        usersDB[email] = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            joinDate: new Date().toISOString()
        };

        resolve({
            success: true,
            message: 'Kayıt başarılı!'
        });
    });
}

// Kullanıcı bilgilerini getir
async function getUser(username) {
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

// E-posta kontrolü
async function checkEmail(email) {
    return new Promise((resolve) => {
        const existingUser = Object.values(usersDB).find(user => user.email === email);
        resolve(!!existingUser);
    });
}

// Kullanıcı adı kontrolü
async function checkUsername(username) {
    return new Promise((resolve) => {
        resolve(!!usersDB[username]);
    });
} 