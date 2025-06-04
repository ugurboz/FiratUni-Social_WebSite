// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    checkAdminStatus();
    loadDashboardData();
    setupEventListeners();
});

// Admin durumunu kontrol et
async function checkAdminStatus() {
    try {
        const email = localStorage.getItem('userEmail');
        if (!email) {
            window.location.href = '../login/login_screen.html';
            return;
        }

        const response = await fetch(`/api/admin/check?email=${email}`);
        const data = await response.json();

        if (!data.isAdmin) {
            window.location.href = '../anasayfa/anasayfa_screen.html';
            return;
        }

        // Admin bilgilerini göster
        const userResponse = await fetch(`/api/profile?email=${email}`);
        const userData = await userResponse.json();
        if (userData.success) {
            document.getElementById('adminName').textContent = `${userData.user.firstName} ${userData.user.lastName}`;
        }
    } catch (error) {
        console.error('Admin durumu kontrol edilirken hata:', error);
        window.location.href = '../login/login_screen.html';
    }
}

// Dashboard verilerini yükle
async function loadDashboardData() {
    try {
        const email = localStorage.getItem('userEmail');
        const response = await fetch(`/api/admin/dashboard?email=${email}`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('totalUsers').textContent = data.data.totalUsers;
            document.getElementById('totalClubs').textContent = data.data.totalClubs;
            document.getElementById('totalPosts').textContent = data.data.totalPosts;
            document.getElementById('totalEvents').textContent = '0'; // Şimdilik 0

            // Son aktiviteleri yükle
            loadRecentActivities();
        } else {
            showNotification('Veriler yüklenirken bir hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Dashboard verileri yüklenirken hata:', error);
        showNotification('Veriler yüklenirken bir hata oluştu', 'error');
    }
}

// Son aktiviteleri yükle
async function loadRecentActivities() {
    try {
        const response = await fetch('/api/admin/activities', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const activities = await response.json();

        const activityList = document.getElementById('activityList');
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-details">
                    <p class="activity-text">${activity.description}</p>
                    <span class="activity-time">${formatTime(activity.timestamp)}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Aktiviteler yüklenirken hata:', error);
    }
}

// Bölümleri göster/gizle
function showSection(sectionId) {
    // Tüm bölümleri gizle
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });

    // Seçilen bölümü göster
    document.getElementById(sectionId).style.display = 'block';

    // Aktif menü öğesini güncelle
    document.querySelectorAll('.nav-links li').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).parentElement.classList.add('active');

    // Bölüme özel verileri yükle
    switch (sectionId) {
        case 'users':
            loadUsers();
            break;
        case 'clubs':
            loadClubs();
            break;
        case 'events':
            loadEvents();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Kullanıcıları yükle
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const users = await response.json();

        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${user.studentNumber || '-'}</td>
                <td>${user.department || '-'}</td>
                <td>
                    <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                        ${user.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                </td>
                <td>
                    <button class="btn-icon" onclick="editUser('${user._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteUser('${user._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Kullanıcılar yüklenirken hata:', error);
        showNotification('Kullanıcılar yüklenirken bir hata oluştu', 'error');
    }
}

// Kulüpleri yükle
async function loadClubs() {
    try {
        const response = await fetch('/api/admin/clubs', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const clubs = await response.json();

        const tbody = document.getElementById('clubsTableBody');
        tbody.innerHTML = clubs.map(club => `
            <tr>
                <td>${club.name}</td>
                <td>${club.president ? `${club.president.firstName} ${club.president.lastName}` : '-'}</td>
                <td>${club.members ? club.members.length : 0}</td>
                <td>
                    <span class="status-badge ${club.isActive ? 'active' : 'inactive'}">
                        ${club.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                </td>
                <td>
                    <button class="btn-icon" onclick="editClub('${club._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteClub('${club._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Kulüpler yüklenirken hata:', error);
        showNotification('Kulüpler yüklenirken bir hata oluştu', 'error');
    }
}

// Etkinlikleri yükle
async function loadEvents() {
    try {
        const response = await fetch('/api/admin/events', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const events = await response.json();

        const tbody = document.getElementById('eventsTableBody');
        tbody.innerHTML = events.map(event => `
            <tr>
                <td>${event.title}</td>
                <td>${event.organizer ? `${event.organizer.firstName} ${event.organizer.lastName}` : '-'}</td>
                <td>${event.club ? event.club.name : '-'}</td>
                <td>${formatDate(event.date)}</td>
                <td>
                    <span class="status-badge ${event.status === 'active' ? 'active' : 'inactive'}">
                        ${getEventStatus(event.status)}
                    </span>
                </td>
                <td>
                    <button class="btn-icon" onclick="editEvent('${event._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteEvent('${event._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Etkinlikler yüklenirken hata:', error);
        showNotification('Etkinlikler yüklenirken bir hata oluştu', 'error');
    }
}

// Ayarları yükle
async function loadSettings() {
    try {
        const response = await fetch('/api/admin/settings', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const settings = await response.json();

        document.getElementById('siteName').value = settings.siteName;
        document.getElementById('siteDescription').value = settings.siteDescription;
        document.getElementById('maintenanceMode').checked = settings.maintenanceMode;
    } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error);
        showNotification('Ayarlar yüklenirken bir hata oluştu', 'error');
    }
}

// Yardımcı fonksiyonlar
function getActivityIcon(type) {
    const icons = {
        'user': 'fa-user',
        'club': 'fa-users',
        'event': 'fa-calendar',
        'post': 'fa-comment'
    };
    return icons[type] || 'fa-info-circle';
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('tr-TR');
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('tr-TR');
}

function getEventStatus(status) {
    const statuses = {
        'upcoming': 'Yaklaşan',
        'ongoing': 'Devam Ediyor',
        'completed': 'Tamamlandı',
        'cancelled': 'İptal Edildi'
    };
    return statuses[status] || status;
}

function showNotification(message, type = 'info') {
    // Bildirim gösterme fonksiyonu
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Modal işlemleri
function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Form işlemleri
document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userData = {
        firstName: document.getElementById('newUserFirstName').value,
        lastName: document.getElementById('newUserLastName').value,
        email: document.getElementById('newUserEmail').value,
        password: document.getElementById('newUserPassword').value
    };

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            showNotification('Kullanıcı başarıyla eklendi', 'success');
            closeModal('addUserModal');
            loadUsers();
        } else {
            const error = await response.json();
            showNotification(error.message, 'error');
        }
    } catch (error) {
        console.error('Kullanıcı eklenirken hata:', error);
        showNotification('Kullanıcı eklenirken bir hata oluştu', 'error');
    }
});

// Arama işlemi
function handleSearch(query) {
    const currentSection = document.querySelector('.section[style="display: block;"]');
    if (!currentSection) return;

    const sectionId = currentSection.id;
    switch (sectionId) {
        case 'users':
            searchUsers(query);
            break;
        case 'clubs':
            searchClubs(query);
            break;
        case 'events':
            searchEvents(query);
            break;
    }
}

// Event listeners
function setupEventListeners() {
    // Modal dışına tıklandığında kapat
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    // ESC tuşuna basıldığında modalı kapat
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
} 