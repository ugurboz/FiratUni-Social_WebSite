const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const wss = new WebSocket.Server({ port: 8080 });

// Bağlı kullanıcıları takip etmek için
const connectedUsers = new Map();

wss.on('connection', (ws, req) => {
    // URL'den token'ı al
    const token = new URLSearchParams(req.url.slice(1)).get('token');
    
    if (!token) {
        ws.close();
        return;
    }

    try {
        // Token'ı doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Kullanıcıyı bağlı kullanıcılar listesine ekle
        connectedUsers.set(userId, ws);

        // Bağlantı koptuğunda kullanıcıyı listeden çıkar
        ws.on('close', () => {
            connectedUsers.delete(userId);
        });

        // Mesajları dinle
        ws.on('message', (message) => {
            const data = JSON.parse(message);
            
            // Profil güncelleme mesajı
            if (data.type === 'profileUpdate') {
                // Güncellenen kullanıcının WebSocket'ini bul
                const userWs = connectedUsers.get(data.userId);
                if (userWs) {
                    // Güncelleme mesajını gönder
                    userWs.send(JSON.stringify({
                        type: 'profileUpdated',
                        data: data.updates
                    }));
                }
            }
        });
    } catch (error) {
        ws.close();
    }
});

module.exports = wss; 