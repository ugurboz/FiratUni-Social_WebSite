// Etkinlik veritabanı simülasyonu
let events = [];

// Bildirim Yönetimi
const NotificationManager = {
    showNotification: function(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notification-message');
        
        notificationMessage.textContent = message;
        notification.className = 'notification';
        notification.classList.add('show', type);
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
};

// Etkinlik Yönetimi
const EventManager = {
    joinEvent: function(eventId) {
        try {
            const event = events.find(e => e.id === eventId);
            if (!event) {
                throw new Error('Etkinlik bulunamadı');
            }

            console.log(`Etkinliğe katılım isteği gönderildi: ${eventId}`);
            NotificationManager.showNotification('Etkinliğe başarıyla katıldınız!');
            
            const joinButton = document.querySelector(`[data-event-id="${eventId}"]`);
            if (joinButton) {
                joinButton.textContent = 'Katıldınız';
                joinButton.disabled = true;
                joinButton.classList.add('joined');
            }

            return true;
        } catch (error) {
            console.error('Etkinliğe katılırken hata:', error);
            throw error;
        }
    },

    loadLiveEvents: function() {
        try {
            const eventsContainer = document.querySelector('.events-container');
            if (!eventsContainer) return;
            
            let eventsHTML = '';
            events.forEach(event => {
                eventsHTML += `
                    <div class="event-item">
                        <div class="event-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="event-details">
                            <h3>${event.title}</h3>
                            <p><i class="fas fa-clock"></i> ${event.time} - ${event.date}</p>
                            <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                            <button class="join-event-btn" data-event-id="${event.id}" onclick="EventManager.joinEvent(${event.id})">Katıl</button>
                        </div>
                    </div>
                `;
            });
            
            eventsContainer.innerHTML = eventsHTML;
            return events;
        } catch (error) {
            console.error('Etkinlikler yüklenirken hata:', error);
            throw error;
        }
    }
};

// Sayfa yüklendiğinde etkinlikleri yükle
document.addEventListener('DOMContentLoaded', function() {
    EventManager.loadLiveEvents();
    loadPosts();
});

// Gönderi oluşturma ve getirme sadece backend ile olacak

async function loadPosts() {
    try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        const posts = data.posts || [];
        const postsContainer = document.getElementById('posts-container');
        postsContainer.innerHTML = '';
        if (posts.length > 0) {
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post';
                postElement.innerHTML = `
                    <div class="post-header">
                        <div class="post-avatar">${post.username ? post.username.charAt(0).toUpperCase() : 'A'}</div>
                        <div class="post-user">
                            <div class="post-author">${post.username || 'Anonim'}</div>
                            <div class="post-time">${formatTime(post.timestamp)}</div>
                        </div>
                    </div>
                    <div class="post-content">${post.content}</div>
                    ${post.image ? `<img src="${post.image}" class="post-image" alt="Post image">` : ''}
                `;
                postsContainer.appendChild(postElement);
            });
        } else {
            postsContainer.innerHTML = '<div class="no-posts">Henüz gönderi yok.</div>';
        }
    } catch (error) {
        console.error('Gönderiler yüklenirken hata:', error);
    }
}

// Gönderi oluşturma
async function createPost(content, image = null) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            throw new Error('Kullanıcı oturumu bulunamadı');
        }
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: user.email,
                content: content,
                image: image
            })
        });
        if (!response.ok) {
            throw new Error('Gönderi kaydedilemedi');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Gönderi oluşturulurken hata:', error);
        throw error;
    }
}

// Gönderileri getir
async function getPosts() {
    try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
            throw new Error('Gönderiler alınamadı');
        }
        const data = await response.json();
        return data.posts || [];
    } catch (error) {
        console.error('Gönderiler getirilirken hata:', error);
        throw error;
    }
}

// Gönderi beğenme
async function likePost(postId) {
    try {
        const post = posts.find(p => p.id === postId);
        if (!post) {
            throw new Error('Gönderi bulunamadı');
        }

        post.likes++;
        return post;
    } catch (error) {
        console.error('Gönderi beğenilirken hata:', error);
        throw error;
    }
}

// Yorum ekleme
async function addComment(postId, comment) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            throw new Error('Kullanıcı oturumu bulunamadı');
        }

        const post = posts.find(p => p.id === postId);
        if (!post) {
            throw new Error('Gönderi bulunamadı');
        }

        const newComment = {
            id: post.comments.length + 1,
            username: user.username,
            content: comment,
            timestamp: new Date().toISOString()
        };

        post.comments.push(newComment);
        return newComment;
    } catch (error) {
        console.error('Yorum eklenirken hata:', error);
        throw error;
    }
}

// Bildirim oluşturma
async function createNotification(type, content, targetUser) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            throw new Error('Kullanıcı oturumu bulunamadı');
        }

        const notification = {
            id: notifications.length + 1,
            type: type,
            content: content,
            fromUser: user.username,
            targetUser: targetUser,
            timestamp: new Date().toISOString(),
            read: false
        };

        notifications.push(notification);
        return notification;
    } catch (error) {
        console.error('Bildirim oluşturulurken hata:', error);
        throw error;
    }
}

// Bildirimleri getir
async function getNotifications() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            throw new Error('Kullanıcı oturumu bulunamadı');
        }

        return notifications.filter(n => n.targetUser === user.username);
    } catch (error) {
        console.error('Bildirimler getirilirken hata:', error);
        throw error;
    }
}

// Bildirimleri okundu olarak işaretle
async function markNotificationsAsRead() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            throw new Error('Kullanıcı oturumu bulunamadı');
        }

        notifications.forEach(notification => {
            if (notification.targetUser === user.username) {
                notification.read = true;
            }
        });

        return true;
    } catch (error) {
        console.error('Bildirimler işaretlenirken hata:', error);
        throw error;
    }
}

// Resim yükleme
async function uploadImage(file) {
    try {
        console.log("uploadImage fonksiyonu çağrıldı", file);
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error('Resim yüklenemedi');
        }
        const data = await response.json();
        return data.imageUrl; // S3'ten dönen URL
    } catch (error) {
        console.error('Resim yüklenirken hata:', error);
        throw error;
    }
}

// Oturum kontrolü
async function checkSession() {
    try {
        const token = localStorage.getItem('authToken');
        return !!token;
    } catch (error) {
        console.error('Oturum kontrolü yapılırken hata:', error);
        return false;
    }
}

// Çıkış yapma
async function handleLogout() {
    try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        return true;
    } catch (error) {
        console.error('Çıkış yapılırken hata:', error);
        throw error;
    }
}

document.getElementById('share-post').addEventListener('click', async function() {
    const postInput = document.querySelector('.post-input');
    const content = postInput.value.trim();
    const imageFile = document.getElementById('post-image').files[0];
    console.log("Paylaş butonuna tıklandı");
    console.log("imageFile nedir:", imageFile);

    if (!content && !imageFile) {
        alert('Lütfen bir içerik girin veya resim ekleyin');
        return;
    }
    try {
        let imageUrl = null;
        if (imageFile) {
            console.log("uploadImage fonksiyonu çağrılıyor", imageFile);
            imageUrl = await uploadImage(imageFile);
        }
        // ... diğer kodlar ...
    } catch (error) {
        console.error('Gönderi paylaşılırken hata:', error);
    }
});

function formatTime(timestamp) {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diff = Math.floor((now - postDate) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
    return postDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
} 