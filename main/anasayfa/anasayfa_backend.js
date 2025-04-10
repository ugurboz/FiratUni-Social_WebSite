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
async function createPost(content, image = null) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            throw new Error('Kullanıcı oturumu bulunamadı');
        }

        const newPost = {
            id: posts.length + 1,
            username: user.username,
            content: content,
            image: image,
            likes: 0,
            comments: [],
            timestamp: new Date().toISOString()
        };

        posts.unshift(newPost);
        return newPost;
    } catch (error) {
        console.error('Gönderi oluşturulurken hata:', error);
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
    try {
        // Gerçek uygulamada burada bir dosya yükleme servisi kullanılacak
        // Şimdilik sadece base64 formatında döndürüyoruz
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
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