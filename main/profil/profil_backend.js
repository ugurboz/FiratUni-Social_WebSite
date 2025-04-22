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

// Profil fotoğrafı ve gönderi işlevleri

// Profil fotoğrafı önizleme
function previewProfilePhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('profilePhotoPreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Profil Fotoğrafı">`;
            
            // Gönderi oluşturma alanındaki avatarı da güncelle
            updateNewPostAvatar(e.target.result);
        }
        reader.readAsDataURL(file);
    }
}

// Gönderi oluşturma alanındaki avatarı güncelle
function updateNewPostAvatar(imageUrl) {
    const avatar = document.getElementById('newPostAvatar');
    if (imageUrl) {
        avatar.innerHTML = `<img src="${imageUrl}" alt="Kullanıcı Fotoğrafı">`;
    } else {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    }
}

// Medya yükleme işlevleri
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            showMediaPreview('image', e.target.result);
        }
        reader.readAsDataURL(file);
    }
}

function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            showMediaPreview('video', e.target.result);
        }
        reader.readAsDataURL(file);
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        showMediaPreview('file', file.name);
    }
}

function handleLocationAdd() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            showMediaPreview('location', `${location.lat}, ${location.lng}`);
        });
    } else {
        alert("Konum servisi kullanılamıyor.");
    }
}

// Medya önizleme
function showMediaPreview(type, content) {
    const preview = document.getElementById('mediaPreview');
    const previewContent = preview.querySelector('.preview-content');
    
    preview.style.display = 'block';
    
    switch(type) {
        case 'image':
            previewContent.innerHTML = `<img src="${content}" alt="Yüklenen Görsel">`;
            break;
        case 'video':
            previewContent.innerHTML = `<video src="${content}" controls></video>`;
            break;
        case 'file':
            previewContent.innerHTML = `
                <div class="file-preview">
                    <i class="fas fa-file-alt"></i>
                    <span>${content}</span>
                </div>`;
            break;
        case 'location':
            previewContent.innerHTML = `
                <div class="location-preview">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${content}</span>
                </div>`;
            break;
    }
}

function removePreview() {
    const preview = document.getElementById('mediaPreview');
    preview.style.display = 'none';
    preview.querySelector('.preview-content').innerHTML = '';
    
    // Input'ları sıfırla
    document.getElementById('imageInput').value = '';
    document.getElementById('videoInput').value = '';
    document.getElementById('fileInput').value = '';
}

// Gönderi oluşturma
function createPost() {
    const content = document.getElementById('postContent').value;
    const preview = document.getElementById('mediaPreview');
    const mediaContent = preview.querySelector('.preview-content').innerHTML;
    
    if (!content && !mediaContent) {
        alert('Lütfen bir içerik girin veya medya ekleyin.');
        return;
    }
    
    // Burada gönderi oluşturma API çağrısı yapılacak
    console.log('Gönderi oluşturuluyor:', { content, mediaContent });
    
    // Formu temizle
    document.getElementById('postContent').value = '';
    removePreview();
    
    // Başarı mesajı göster
    alert('Gönderi başarıyla paylaşıldı!');
}

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    // Profil fotoğrafını yükle
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.profilePhoto) {
        updateNewPostAvatar(userData.profilePhoto);
    }
}); 