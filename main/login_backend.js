// Kullanıcı veritabanı simülasyonu
const users = {
    'admin': {
        password: 'admin',
        role: 'admin',
        name: 'Admin User'
    }
};

// Login işlemini gerçekleştiren fonksiyon
function handleLogin(username, password) {
    return new Promise((resolve, reject) => {
        // Kullanıcı kontrolü
        if (users[username] && users[username].password === password) {
            // Başarılı giriş
            resolve({
                success: true,
                user: {
                    username: username,
                    role: users[username].role,
                    name: users[username].name
                }
            });
        } else {
            // Hatalı giriş
            reject({
                success: false,
                message: 'Kullanıcı adı veya şifre hatalı!'
            });
        }
    });
}

// Kayıt işlemini gerçekleştiren fonksiyon
function handleRegister(username, password, email) {
    return new Promise((resolve, reject) => {
        // Kullanıcı adı kontrolü
        if (users[username]) {
            reject({
                success: false,
                message: 'Bu kullanıcı adı zaten kullanılıyor!'
            });
            return;
        }

        // Yeni kullanıcı oluştur
        users[username] = {
            password: password,
            email: email,
            role: 'user',
            name: username
        };

        resolve({
            success: true,
            message: 'Kayıt başarılı!'
        });
    });
}

// Şifre sıfırlama işlemini gerçekleştiren fonksiyon
function handlePasswordReset(email) {
    return new Promise((resolve, reject) => {
        // E-posta kontrolü
        const user = Object.values(users).find(u => u.email === email);
        
        if (user) {
            // Gerçek uygulamada burada e-posta gönderimi yapılır
            resolve({
                success: true,
                message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'
            });
        } else {
            reject({
                success: false,
                message: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.'
            });
        }
    });
}

// Oturum kontrolü
function checkSession() {
    return new Promise((resolve) => {
        // Gerçek uygulamada burada token kontrolü yapılır
        const token = localStorage.getItem('authToken');
        resolve(!!token);
    });
}

// Çıkış işlemi
function handleLogout() {
    localStorage.removeItem('authToken');
    return Promise.resolve({ success: true });
} 