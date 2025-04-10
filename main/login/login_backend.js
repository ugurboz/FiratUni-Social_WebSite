// Giriş backend işlevleri

// Örnek kullanıcı veritabanı
const usersDB = {
    'admin@firat.edu.tr': {
        email: 'admin@firat.edu.tr',
        password: 'admin',
        joinDate: new Date().toISOString()
    }
};

// Giriş işlemi
async function handleLogin(email, password) {
    return new Promise((resolve, reject) => {
        try {
            // E-posta kontrolü
            if (!email.endsWith('@firat.edu.tr')) {
                reject(new Error('Lütfen Fırat Üniversitesi e-posta adresinizi kullanın!'));
                return;
            }

            const user = usersDB[email];
            if (!user) {
                reject(new Error('Kullanıcı bulunamadı!'));
                return;
            }

            if (user.password !== password) {
                reject(new Error('Şifre hatalı!'));
                return;
            }

            resolve({
                success: true,
                user: {
                    email: user.email,
                    joinDate: user.joinDate
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Kayıt işlemini gerçekleştiren fonksiyon
function handleRegister(password, email) {
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

// Şifre sıfırlama
async function handlePasswordReset(email) {
    return new Promise((resolve, reject) => {
        try {
            // E-posta kontrolü
            if (!email.endsWith('@firat.edu.tr')) {
                reject(new Error('Lütfen Fırat Üniversitesi e-posta adresinizi kullanın!'));
                return;
            }

            const user = usersDB[email];
            if (!user) {
                reject(new Error('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı!'));
                return;
            }

            // Şifre sıfırlama bağlantısı gönderildi simülasyonu
            resolve({
                success: true,
                message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!'
            });
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