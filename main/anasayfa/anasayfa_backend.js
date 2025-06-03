// Etkinlik veritabanı simülasyonu
let events = [
    { id: 1, title: 'Yazılım Geliştirme Atölyesi', time: '14:00', date: '25 Temmuz', location: 'Mühendislik Fakültesi' },
    { id: 2, title: 'Kariyer Günleri', time: '10:30', date: '27 Temmuz', location: 'Kongre Merkezi' },
    { id: 3, title: 'Mezuniyet Töreni', time: '16:00', date: '30 Temmuz', location: 'Spor Salonu' }
];

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
});

// Gönderi veritabanı simülasyonu
let posts = [
    {
        id: 1,
        username: 'admin',
        content: 'Hoş geldiniz! Bu platformda akademik duyuruları, sosyal etkinlikleri ve ders notlarını paylaşabilirsiniz.',
        image: null,
        likes: 0,
        comments: [],
        timestamp: new Date().toISOString()
    }
];

// Bildirim veritabanı simülasyonu
let notifications = [];

// Gönderi oluşturma
async function createPost(content, imageUrl = null, videoUrl = null) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: user.username,
                content,
                image: imageUrl,
                video: videoUrl || null,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Post gönderme başarısız');
        }

        const newPost = await response.json();
        return newPost;
    } catch (error) {
        console.error("createPost() hatası:", error);
        throw error;
    }
}


// Gönderileri getir
async function getPosts() {
    try {
        return posts;
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
    console.log("uploadImage fonksiyonu çağrıldı:", file);

    try {
        const formData = new FormData();
        formData.append('image', file); // ⬅️ burası 'image' olmalı

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Dosya yükleme başarısız');
        }

        const data = await response.json();
        return data.imageUrl; // S3 linki
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
// Paylaş butonuna tıklama işlemi
document.addEventListener('DOMContentLoaded', function () {
    const shareButton = document.getElementById('share-post');
    const postInput = document.querySelector('.post-input');
    const imageInput = document.getElementById('post-image');

    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            const content = postInput.value.trim();
            const imageFile = imageInput.files[0];
            let imageUrl = null;

            try {
                if (imageFile) {
                    imageUrl = await uploadImage(imageFile); // 🟢 AWS S3'e gönderiyoruz
                }

                const newPost = await createPost(content, imageUrl);
                NotificationManager.showNotification('Gönderi paylaşıldı!', 'success');

                // Opsiyonel: inputları temizle
                postInput.value = '';
                imageInput.value = '';

                // Gönderiyi sayfaya ekle
                // renderPost(newPost); // Eğer gönderi anında görünmeli diyorsan bunu tanımlamalısın
            } catch (error) {
                NotificationManager.showNotification('Gönderi paylaşılırken hata oluştu', 'error');
            }
        });
    }
});
