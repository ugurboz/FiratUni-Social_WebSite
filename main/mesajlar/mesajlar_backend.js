// Mesajlaşma backend işlevleri

// Boş mesaj veritabanı - kullanıcılar dinamik olarak eklenecek
const messagesDB = {};

// DOM yükleme kontrolü
document.addEventListener('DOMContentLoaded', function() {
    // Tema desteğini yükle (dark/light)
    if (typeof loadUserTheme === 'function') {
        loadUserTheme();
    } else {
        // Theme.js henüz yüklenmediyse tekrar dene
        setTimeout(() => {
            if (typeof loadUserTheme === 'function') {
                loadUserTheme();
            }
        }, 500);
    }

    // Oturum kontrolü yap ve kullanıcı arayüzünü hazırla
    initializeMessaging();
});

// Mesajlaşma sistemini başlat
async function initializeMessaging() {
    try {
        // Oturum kontrolü
        const isLoggedIn = await checkSession();
        if (!isLoggedIn) {
            window.location.href = '../login/login_screen.html';
            return;
        }

        // Kullanıcı arama alanına event listener ekle
        document.getElementById('searchUser').addEventListener('input', function() {
            filterUsers(this.value);
        });

        // Mesaj gönderme için event listener ekle
        document.getElementById('message-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Kullanıcı listesini yükle
        loadUserList();

    } catch (error) {
        console.error('Mesajlaşma başlatılırken hata:', error);
    }
}

// Kullanıcı listesini filtrele
function filterUsers(searchTerm) {
    const userItems = document.querySelectorAll('.user-item');
    const searchLower = searchTerm.toLowerCase();
    
    let hasVisibleUser = false;
    
    userItems.forEach(item => {
        const userName = item.querySelector('.user-name').textContent.toLowerCase();
        const lastMessage = item.querySelector('.last-message').textContent.toLowerCase();
        
        if (userName.includes(searchLower) || lastMessage.includes(searchLower)) {
            item.style.display = 'flex';
            hasVisibleUser = true;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Eğer hiçbir kullanıcı görünmüyorsa boş durum mesajını göster
    const emptyState = document.getElementById('empty-users-state');
    if (emptyState) {
        emptyState.style.display = hasVisibleUser ? 'none' : 'flex';
    }
}

// Kullanıcı listesini yükle
async function loadUserList() {
    const userListContainer = document.getElementById('user-list-container');
    const emptyState = document.getElementById('empty-users-state');
    
    try {
        // Normalde API'den kullanıcı listesi çekilir
        // Şimdilik örnek boş bir liste gösterelim
        const users = []; // Boş liste
        
        if (users.length === 0) {
            // Kullanıcı yoksa boş durum göster
            emptyState.style.display = 'flex';
        } else {
            // Kullanıcılar varsa liste oluştur
            emptyState.style.display = 'none';
            
            // Kullanıcıları listele
            users.forEach((user, index) => {
                const userElement = createUserElement(user, index);
                userListContainer.appendChild(userElement);
            });
            
            // İlk kullanıcıyı varsayılan olarak seç
            if (users.length > 0) {
                selectUser(0);
            }
        }
    } catch (error) {
        console.error('Kullanıcı listesi yüklenirken hata:', error);
        emptyState.style.display = 'flex';
    }
}

// Kullanıcı elementi oluştur
function createUserElement(user, userId) {
    const userElement = document.createElement('div');
    userElement.className = 'user-item';
    userElement.setAttribute('data-user-id', userId);
    userElement.onclick = () => selectUser(userId);
    
    // Kullanıcının adının baş harfini al
    const initial = user.name.charAt(0).toUpperCase();
    
    userElement.innerHTML = `
        <div class="user-avatar">${initial}</div>
        <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="last-message">${user.lastMessage || 'Henüz mesaj yok'}</div>
        </div>
        <div class="message-time">${user.lastMessageTime || ''}</div>
    `;
    
    return userElement;
}

// Kullanıcı seç ve sohbeti göster
function selectUser(userId) {
    // Aktif kullanıcı stilini güncelle
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const selectedUserElement = document.querySelector(`.user-item[data-user-id="${userId}"]`);
    if (selectedUserElement) {
        selectedUserElement.classList.add('active');
        
        // Kullanıcı bilgilerini başlıkta göster
        const userAvatar = selectedUserElement.querySelector('.user-avatar').textContent;
        const userName = selectedUserElement.querySelector('.user-name').textContent;
        
        document.getElementById('selected-user-avatar').textContent = userAvatar;
        document.getElementById('selected-user-name').textContent = userName;
        document.getElementById('selected-user-status').textContent = 'Çevrimiçi';
        
        // Mesajları yükle
        loadMessages(userId);
    }
}

// Mesajları yükle
async function loadMessages(userId) {
    const messagesContainer = document.getElementById('messages-container');
    const emptyChatState = document.getElementById('empty-chat-state');
    
    try {
        // Mesajları temizle
        messagesContainer.innerHTML = '';
        messagesContainer.appendChild(emptyChatState);
        
        // Normalde API'den mesajlar çekilir
        // Şimdilik boş liste gösterelim
        const messages = []; // Boş liste
        
        if (messages.length === 0) {
            // Mesaj yoksa boş durum göster
            emptyChatState.style.display = 'flex';
        } else {
            // Mesajlar varsa göster
            emptyChatState.style.display = 'none';
            
            // Mesajları göster
            messages.forEach(message => {
                const messageElement = createMessageElement(message);
                messagesContainer.appendChild(messageElement);
            });
            
            // En alt mesaja kaydır
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    } catch (error) {
        console.error('Mesajlar yüklenirken hata:', error);
        emptyChatState.style.display = 'flex';
    }
}

// Mesaj elementi oluştur
function createMessageElement(message) {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isCurrentUser = message.sender === currentUser.email;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isCurrentUser ? 'message-sent' : 'message-received'}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-time">${time}</div>
    `;
    
    return messageElement;
}

// Mesaj gönderme fonksiyonu
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();
    
    if (!content) return;
    
    try {
        const selectedUserElement = document.querySelector('.user-item.active');
        if (!selectedUserElement) {
            alert('Lütfen önce bir kullanıcı seçin');
            return;
        }
        
        const userId = selectedUserElement.getAttribute('data-user-id');
        
        // Normalde API'ye mesaj gönderilir
        // Şimdilik sadece input temizleyeceğiz
        messageInput.value = '';
        
        // Mesajı göster (normalde API yanıtı ile gösterilir)
        const messagesContainer = document.getElementById('messages-container');
        const emptyChatState = document.getElementById('empty-chat-state');
        
        // Boş durum mesajını gizle
        emptyChatState.style.display = 'none';
        
        // Mesajı ekle
        const message = {
            content: content,
            timestamp: new Date().toISOString(),
            sender: JSON.parse(localStorage.getItem('user') || '{}').email
        };
        
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);
        
        // En alta kaydır
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
    } catch (error) {
        console.error('Mesaj gönderilirken hata:', error);
        alert('Mesaj gönderilemedi');
    }
}

// Oturum kontrolü
async function checkSession() {
    return new Promise((resolve) => {
        const token = localStorage.getItem('authToken');
        resolve(!!token);
    });
}

// Çıkış yapma fonksiyonu
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    localStorage.removeItem('userEmail');
    window.location.href = '../login/login_screen.html';
} 