// Mesajlaşma backend işlevleri

// Örnek mesaj veritabanı
const messagesDB = {
    'admin': {
        'user1': [
            { sender: 'user1', content: 'Merhaba, nasılsın?', timestamp: '2024-03-10T10:00:00' },
            { sender: 'admin', content: 'İyiyim, teşekkürler!', timestamp: '2024-03-10T10:05:00' }
        ],
        'user2': [
            { sender: 'user2', content: 'Proje hakkında konuşalım mı?', timestamp: '2024-03-09T15:30:00' },
            { sender: 'admin', content: 'Tabii, ne zaman uygunsun?', timestamp: '2024-03-09T15:35:00' }
        ]
    }
};

// Mesaj gönderme fonksiyonu
async function sendMessage(receiver, content) {
    return new Promise((resolve, reject) => {
        try {
            const sender = JSON.parse(localStorage.getItem('user')).username;
            const timestamp = new Date().toISOString();
            
            if (!messagesDB[receiver]) {
                messagesDB[receiver] = {};
            }
            if (!messagesDB[receiver][sender]) {
                messagesDB[receiver][sender] = [];
            }
            
            const message = {
                sender,
                content,
                timestamp
            };
            
            messagesDB[receiver][sender].push(message);
            resolve(message);
        } catch (error) {
            reject(error);
        }
    });
}

// Mesajları getirme fonksiyonu
async function getMessages(user) {
    return new Promise((resolve, reject) => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user')).username;
            const messages = messagesDB[currentUser]?.[user] || [];
            resolve(messages);
        } catch (error) {
            reject(error);
        }
    });
}

// Kullanıcı listesini getirme fonksiyonu
async function getUsers() {
    return new Promise((resolve, reject) => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user')).username;
            const users = Object.keys(messagesDB[currentUser] || {});
            resolve(users);
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