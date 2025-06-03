// Admin Panel Management
class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.checkAdminStatus();
        this.initializeEventListeners();
    }

    async checkAdminStatus() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const email = user.email;
            if (!email) {
                this.showLoginForm();
                return;
            }

            const response = await fetch(`/api/admin/check-status?email=${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();

            if (data.success && data.isAdmin) {
                this.showAdminPanel();
                this.loadDashboardStats();
                this.loadClubs();
                this.loadEvents();
                this.loadUsers();
            } else {
                this.showLoginForm();
            }
        } catch (error) {
            console.error('Admin status check error:', error);
            this.showLoginForm();
        }
    }

    showLoginForm() {
        document.getElementById('adminLogin').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
    }

    showAdminPanel() {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    }

    initializeEventListeners() {
        // Admin Login Form
        document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();
                if (data.success) {
                    this.showAdminPanel();
                    this.loadDashboardStats();
                    this.loadClubs();
                    this.loadEvents();
                    this.loadUsers();
                } else {
                    this.showNotification('Admin girişi başarısız', 'error');
                }
            } catch (error) {
                console.error('Admin login error:', error);
                this.showNotification('Giriş sırasında bir hata oluştu', 'error');
            }
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.switchSection(section);
            });
        });

        // Forms
        document.getElementById('addClubForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddClub(e.target);
        });

        document.getElementById('addEventForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddEvent(e.target);
        });

        document.getElementById('settingsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSettingsUpdate(e.target);
        });
    }

    // Section Management
    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === section) {
                item.classList.add('active');
            }
        });

        // Update content
        document.querySelectorAll('.content-section').forEach(content => {
            content.classList.remove('active');
            if (content.id === section) {
                content.classList.add('active');
            }
        });

        this.currentSection = section;
    }

    // Dashboard
    async loadDashboardStats() {
        try {
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                document.getElementById('totalUsers').textContent = data.stats.totalUsers;
                document.getElementById('activeEvents').textContent = data.stats.activeEvents;
                document.getElementById('totalClubs').textContent = data.stats.totalClubs;
            }
        } catch (error) {
            console.error('Dashboard stats loading error:', error);
            // Fallback to demo data
            document.getElementById('totalUsers').textContent = '0';
            document.getElementById('activeEvents').textContent = '0';
            document.getElementById('totalClubs').textContent = '0';
        }
    }

    // Clubs Management
    async loadClubs() {
        try {
            const response = await fetch('/api/admin/clubs', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                this.renderClubs(data.clubs);
            }
        } catch (error) {
            console.error('Clubs loading error:', error);
            this.renderClubs([]);
        }
    }

    renderClubs(clubs) {
        const clubsList = document.getElementById('clubsList');
        if (!clubsList) return;

        clubsList.innerHTML = clubs.length ? '' : '<div class="empty-state">Henüz kulüp bulunmuyor</div>';

        clubs.forEach(club => {
            const clubElement = document.createElement('div');
            clubElement.className = 'club-item';
            clubElement.innerHTML = `
                <div class="club-info">
                    <h3>${club.name}</h3>
                    <p>${club.description}</p>
                    <div class="club-meta">
                        <span><i class="fas fa-users"></i> ${club.members?.length || 0} Üye</span>
                        <span><i class="fas fa-calendar"></i> ${club.events?.length || 0} Etkinlik</span>
                    </div>
                </div>
                <div class="club-actions">
                    <button onclick="adminPanel.editClub('${club._id}')" class="edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="adminPanel.deleteClub('${club._id}')" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            clubsList.appendChild(clubElement);
        });
    }

    async handleAddClub(form) {
        const formData = new FormData(form);
        const clubData = {
            name: formData.get('clubName'),
            description: formData.get('clubDescription'),
            category: formData.get('clubCategory'),
            icon: formData.get('clubIcon')
        };

        try {
            const response = await fetch('/api/admin/clubs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(clubData)
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Kulüp başarıyla eklendi', 'success');
                this.closeModal('addClubModal');
                this.loadClubs();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Club creation error:', error);
            this.showNotification('Kulüp eklenirken bir hata oluştu', 'error');
        }
    }

    async deleteClub(clubId) {
        if (!confirm('Bu kulübü silmek istediğinize emin misiniz?')) return;

        try {
            const response = await fetch(`/api/admin/clubs/${clubId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Kulüp başarıyla silindi', 'success');
                this.loadClubs();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Club deletion error:', error);
            this.showNotification('Kulüp silinirken bir hata oluştu', 'error');
        }
    }

    // Events Management
    async loadEvents() {
        try {
            const response = await fetch('/api/admin/events', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                this.renderEvents(data.events);
            }
        } catch (error) {
            console.error('Events loading error:', error);
            this.renderEvents([]);
        }
    }

    renderEvents(events) {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;

        eventsList.innerHTML = events.length ? '' : '<div class="empty-state">Henüz etkinlik bulunmuyor</div>';

        events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event-item';
            eventElement.innerHTML = `
                <div class="event-info">
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                    <div class="event-meta">
                        <span><i class="fas fa-calendar"></i> ${new Date(event.date).toLocaleDateString()}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                        <span><i class="fas fa-users"></i> ${event.participants?.length || 0}/${event.maxParticipants} Katılımcı</span>
                    </div>
                </div>
                <div class="event-actions">
                    <button onclick="adminPanel.editEvent('${event._id}')" class="edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="adminPanel.deleteEvent('${event._id}')" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            eventsList.appendChild(eventElement);
        });
    }

    async handleAddEvent(form) {
        const formData = new FormData(form);
        const eventData = {
            title: formData.get('eventTitle'),
            date: formData.get('eventDate'),
            location: formData.get('eventLocation'),
            description: formData.get('eventDescription'),
            category: formData.get('eventCategory'),
            maxParticipants: parseInt(formData.get('maxParticipants'))
        };

        try {
            const response = await fetch('/api/admin/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(eventData)
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Etkinlik başarıyla eklendi', 'success');
                this.closeModal('addEventModal');
                this.loadEvents();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Event creation error:', error);
            this.showNotification('Etkinlik eklenirken bir hata oluştu', 'error');
        }
    }

    async deleteEvent(eventId) {
        if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;

        try {
            const response = await fetch(`/api/admin/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Etkinlik başarıyla silindi', 'success');
                this.loadEvents();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Event deletion error:', error);
            this.showNotification('Etkinlik silinirken bir hata oluştu', 'error');
        }
    }

    // Users Management
    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                this.renderUsers(data.users);
            }
        } catch (error) {
            console.error('Users loading error:', error);
            this.renderUsers([]);
        }
    }

    renderUsers(users) {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

        usersList.innerHTML = users.length ? '' : '<div class="empty-state">Henüz kullanıcı bulunmuyor</div>';

        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
                <div class="user-info">
                    <h3>${user.name}</h3>
                    <p>${user.email}</p>
                    <div class="user-meta">
                        <span><i class="fas fa-users"></i> ${user.clubs?.length || 0} Kulüp</span>
                        <span><i class="fas fa-calendar-check"></i> ${user.events?.length || 0} Etkinlik</span>
                    </div>
                </div>
                <div class="user-actions">
                    <button onclick="adminPanel.toggleUserStatus('${user._id}')" class="status-btn ${user.active ? 'active' : 'inactive'}">
                        <i class="fas fa-${user.active ? 'check' : 'times'}"></i>
                    </button>
                    <button onclick="adminPanel.deleteUser('${user._id}')" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            usersList.appendChild(userElement);
        });
    }

    async toggleUserStatus(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Kullanıcı durumu güncellendi', 'success');
                this.loadUsers();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('User status toggle error:', error);
            this.showNotification('Kullanıcı durumu güncellenirken bir hata oluştu', 'error');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Kullanıcı başarıyla silindi', 'success');
                this.loadUsers();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('User deletion error:', error);
            this.showNotification('Kullanıcı silinirken bir hata oluştu', 'error');
        }
    }

    // Settings Management
    async handleSettingsUpdate(form) {
        const formData = new FormData(form);
        const settingsData = {
            siteName: formData.get('siteName'),
            maintenanceMode: formData.get('maintenanceMode') === 'on',
            maxFileSize: parseInt(formData.get('maxFileSize'))
        };

        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(settingsData)
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Ayarlar başarıyla güncellendi', 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Settings update error:', error);
            this.showNotification('Ayarlar güncellenirken bir hata oluştu', 'error');
        }
    }

    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }

    // Notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
}); 