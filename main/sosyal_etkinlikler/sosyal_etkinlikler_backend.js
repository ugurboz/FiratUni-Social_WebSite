// Event Management
class EventManager {
    constructor() {
        // Örnek etkinlikler
        this.events = JSON.parse(localStorage.getItem('events')) || [
    {
        id: 1,
                title: 'Kodlama Workshop',
                date: '2023-06-15T14:00',
                location: 'Mühendislik Fakültesi, Lab 3',
                description: 'Web geliştirme teknolojileri üzerine uygulamalı workshop.',
                category: 'tech',
                status: 'upcoming',
                participants: 15,
                maxParticipants: 30,
                progress: 0
            },
            {
                id: 2,
                title: 'Müzik Festivali',
                date: '2023-06-20T18:00',
                location: 'Merkez Kampüs Amfi',
                description: 'Üniversitemiz müzik topluluğu tarafından düzenlenen festival.',
                category: 'cultural',
                status: 'ongoing',
                participants: 120,
                maxParticipants: 200,
                progress: 60
            },
            {
                id: 3,
                title: 'Futbol Turnuvası',
                date: '2023-06-10T10:00',
                location: 'Spor Kompleksi, Saha 2',
                description: 'Bölümler arası futbol turnuvası final maçları.',
                category: 'sport',
                status: 'upcoming',
                participants: 48,
                maxParticipants: 50,
                progress: 0
            }
        ];
        
        localStorage.setItem('events', JSON.stringify(this.events));
        
        // DOM elementleri
        this.searchInput = document.getElementById('searchBox');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.eventsGrid = document.querySelector('.events-grid');
        this.liveEventsList = document.getElementById('liveEventsList');
        
        // API endpoint
        this.apiEndpoint = 'https://api.begak.com/events';
        
        // Event listener'ları bağla
        this.bindEventListeners();
        
        // Başlangıçta etkinlikleri yükle
        this.loadEventsFromDatabase();
    }
    
    bindEventListeners() {
        // Arama kutusuna listener ekle
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                this.filterEvents(this.searchInput.value);
            });
        }
        
        // Filtre butonlarına listener ekle
        if (this.filterButtons) {
            this.filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Aktif butonu güncelle
                    this.filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    // Etkinlikleri filtrele
                    this.filterEventsByStatus(button.dataset.filter);
                });
            });
        }
        
        // Form submit listener'ı
        const eventForm = document.getElementById('eventForm');
        if (eventForm) {
            eventForm.addEventListener('submit', (e) => this.handleEventSubmit(e));
        }
        
        // Global olarak etkinlik silme fonksiyonunu tanımla
        window.deleteEvent = (id) => this.deleteEvent(id);
        window.editEvent = (id) => this.editEvent(id);
        window.finishEvent = (id) => this.finishEvent(id);
        window.toggleEventMenu = (button) => this.toggleEventMenu(button);
    }
    
    filterEvents(searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        
        // Etkinlik kartlarını filtrele
        const eventCards = document.querySelectorAll('.event-card');
        
        eventCards.forEach(card => {
            const title = card.querySelector('.event-title').textContent.toLowerCase();
            const description = card.querySelector('.event-description').textContent.toLowerCase();
            const location = card.querySelector('.event-location').textContent.toLowerCase();
            
            // Eşleşme varsa göster, yoksa gizle
            if (title.includes(searchTerm) || description.includes(searchTerm) || location.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    filterEventsByStatus(status) {
        // Tüm event kartlarını göster
        const eventCards = document.querySelectorAll('.event-card');
        eventCards.forEach(card => {
            card.style.display = 'flex';
        });
        
        // Filtre seçiliyse, ilgili kartları filtrele
        if (status !== 'all') {
            eventCards.forEach(card => {
                const cardStatus = card.dataset.status;
                if (cardStatus !== status) {
                    card.style.display = 'none';
                }
            });
        }
    }
    
    async handleEventSubmit(e) {
        e.preventDefault();
        
        // Form verilerini al
        const newEvent = {
            id: Date.now(), // Benzersiz ID için timestamp kullan
            title: document.getElementById('eventName').value,
            date: document.getElementById('eventDate').value,
            location: document.getElementById('eventLocation').value,
            description: document.getElementById('eventDescription').value,
            category: document.getElementById('eventCategory').value,
            status: 'upcoming',
            participants: 0,
            maxParticipants: parseInt(document.getElementById('eventMaxParticipants').value) || 50,
            progress: 0,
            createdBy: this.getCurrentUserId(),
            createdAt: new Date().toISOString()
        };
        
        try {
            // Veritabanına etkinliği ekle
            await this.addEventToDatabase(newEvent);
            
            // Etkinliği listeye ekle
            this.events.push(newEvent);
            
            // LocalStorage'ı güncelle
            localStorage.setItem('events', JSON.stringify(this.events));
            
            // DOM'a yeni etkinliği ekle
            this.addEventToDOM(newEvent);
            this.addLiveEventToDOM(newEvent);
            
            // Formu kapat ve sıfırla
            document.getElementById('eventForm').reset();
            this.toggleEventForm();
            
            // Etkinlik durumunu kontrol et
            this.checkEventListStatus();
            
            // Başarı mesajı göster
            this.showNotification('Etkinlik başarıyla oluşturuldu!', 'success');
        } catch (error) {
            console.error('Etkinlik oluşturma hatası:', error);
            this.showNotification('Etkinlik oluşturulurken bir hata oluştu!', 'error');
        }
    }
    
    // Etkinliği etkinlikler bölümüne ekle
    addEventToDOM(event) {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.dataset.status = event.status;
        eventCard.dataset.id = event.id;
        
        eventCard.innerHTML = `
        <div class="event-header">
                <h3 class="event-title">${event.title}</h3>
                <span class="event-status ${event.status}">${this.getStatusText(event.status)}</span>
        </div>
        <div class="event-details">
                <div class="event-date"><i class="fas fa-calendar"></i> ${this.formatDate(event.date)}</div>
                <div class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>
        </div>
            <p class="event-description">${event.description}</p>
        <div class="event-actions">
                <button class="action-btn join-btn" onclick="window.eventManager.toggleParticipation(${event.id})">
                    <i class="fas fa-user-plus"></i> Katıl
                </button>
                <button class="action-btn share-btn" onclick="window.eventManager.shareEvent(${event.id})">
                    <i class="fas fa-share-alt"></i> Paylaş
                </button>
                <span class="participants-count"><i class="fas fa-users"></i> ${event.participants}/${event.maxParticipants}</span>
        </div>
    `;
    
        // Etkinlik kartını DOM'a ekle
        if (this.eventsGrid) {
            this.eventsGrid.appendChild(eventCard);
        }
    }
    
    // Canlı etkinliği sağ panele ekle
    addLiveEventToDOM(event) {
        // Eğer "etkinlik bulunamadı" mesajı görünüyorsa gizle
        const noEventsMsg = document.getElementById('noEvents');
        if (noEventsMsg) {
            noEventsMsg.style.display = 'none';
        }
        
        if (this.liveEventsList) {
            this.liveEventsList.style.display = 'flex';
            
            const eventItem = document.createElement('div');
            eventItem.className = 'live-event-item';
            eventItem.dataset.id = event.id;
            
            eventItem.innerHTML = `
                <div class="live-event-header">
                    <h4 class="live-event-title">${event.title}</h4>
                    <span class="live-event-status ${event.status}"></span>
                    <button class="dropdown-toggle" onclick="toggleEventMenu(this)">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu">
                        <a href="#" onclick="editEvent(${event.id})"><i class="fas fa-edit"></i> Düzenle</a>
                        <a href="#" onclick="finishEvent(${event.id})"><i class="fas fa-check-circle"></i> Bitir</a>
                        <a href="#" onclick="deleteEvent(${event.id})"><i class="fas fa-trash"></i> Sil</a>
                    </div>
                </div>
                <div class="live-event-details">
                    <div class="detail-item"><i class="fas fa-calendar"></i> ${this.formatDate(event.date)}</div>
                    <div class="detail-item"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>
                    <div class="detail-item"><i class="fas fa-users"></i> ${event.participants}/${event.maxParticipants}</div>
                </div>
                <p class="live-event-description">${event.description}</p>
                <div class="event-progress">
                    <div class="progress-bar" style="width: ${event.progress}%"></div>
                </div>
            `;
            
            this.liveEventsList.appendChild(eventItem);
        }
    }
    
    // Etkinlikleri render et
    renderEvents() {
        if (this.eventsGrid) {
            this.eventsGrid.innerHTML = '';
            this.events.forEach(event => {
                this.addEventToDOM(event);
            });
        }
    }
    
    // Canlı etkinlikleri render et
    renderLiveEvents() {
        if (this.liveEventsList) {
            this.liveEventsList.innerHTML = '';
            this.events.forEach(event => {
                this.addLiveEventToDOM(event);
            });
            
            // Etkinlik durumunu kontrol et
            this.checkEventListStatus();
        }
    }
    
    // Etkinlik listesi durumunu kontrol et (boş mu değil mi)
    checkEventListStatus() {
        const noEventsMsg = document.getElementById('noEvents');
        
        if (this.liveEventsList && noEventsMsg) {
            if (this.liveEventsList.children.length === 0) {
                noEventsMsg.style.display = 'flex';
                this.liveEventsList.style.display = 'none';
            } else {
                noEventsMsg.style.display = 'none';
                this.liveEventsList.style.display = 'flex';
            }
        }
    }
    
    // Tarih formatlama
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}`;
    }
    
    // Durum metni getir
    getStatusText(status) {
        const statusMap = {
            'upcoming': 'Yaklaşan',
            'ongoing': 'Devam Ediyor',
            'past': 'Tamamlandı'
        };
        return statusMap[status] || status;
    }

    toggleEventForm() {
        const form = document.getElementById('eventForm');
        form.classList.toggle('active');
        form.reset();
    }
    
    // Yeni metotlar - Veritabanı işlemleri
    
    // Mevcut kullanıcı ID'sini al
    getCurrentUserId() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user ? (user.id || user.email) : 'anonymous';
    }
    
    // Veritabanından etkinlikleri yükle
    async loadEventsFromDatabase() {
        try {
            // API çağrısı yap
            const response = await fetch(`${this.apiEndpoint}/list`);
            
            // Demo modunda, gerçek API yoksa localStorage'dan yükle
            if (!response.ok) {
                console.warn('API bağlantısı yok, localStorage verileri kullanılıyor.');
                this.renderEvents();
                this.renderLiveEvents();
                return;
            }
            
            const data = await response.json();
            
            if (data.success && data.events) {
                this.events = data.events;
                localStorage.setItem('events', JSON.stringify(this.events));
                
                // DOM'u güncelle
                this.renderEvents();
                this.renderLiveEvents();
            }
        } catch (error) {
            console.error('Etkinlikler yüklenirken hata oluştu:', error);
            // API erişilemiyorsa localStorage'dan yükle
            this.renderEvents();
            this.renderLiveEvents();
        }
    }
    
    // Veritabanına etkinlik ekle
    async addEventToDatabase(event) {
        try {
            // API çağrısı yap
            const response = await fetch(`${this.apiEndpoint}/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(event)
            });
            
            // Demo modunda, gerçek API yoksa başarılı simüle et
            if (!response.ok) {
                console.warn('API bağlantısı yok, etkinlik eklemesi simüle ediliyor.');
                return event;
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Etkinlik eklenemedi');
            }
            
            return data.event;
        } catch (error) {
            console.error('Etkinlik veritabanına eklenirken hata:', error);
            // API erişilemiyorsa başarılı simüle et
            return event;
        }
    }
    
    // Veritabanından etkinlik sil
    async deleteEventFromDatabase(eventId) {
        try {
            // API çağrısı yap
            const response = await fetch(`${this.apiEndpoint}/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            // Demo modunda, gerçek API yoksa başarılı simüle et
            if (!response.ok) {
                console.warn('API bağlantısı yok, etkinlik silmesi simüle ediliyor.');
                return true;
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Etkinlik silinemedi');
            }
            
            return true;
        } catch (error) {
            console.error('Etkinlik veritabanından silinirken hata:', error);
            // API erişilemiyorsa başarılı simüle et
            return true;
        }
    }
    
    // Veritabanında etkinlik güncelle
    async updateEventInDatabase(event) {
        try {
            // API çağrısı yap
            const response = await fetch(`${this.apiEndpoint}/${event.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(event)
            });
            
            // Demo modunda, gerçek API yoksa başarılı simüle et
            if (!response.ok) {
                console.warn('API bağlantısı yok, etkinlik güncellemesi simüle ediliyor.');
                return event;
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Etkinlik güncellenemedi');
            }
            
            return data.event;
        } catch (error) {
            console.error('Etkinlik veritabanında güncellenirken hata:', error);
            // API erişilemiyorsa başarılı simüle et
            return event;
        }
    }
    
    // Etkinliğe katılma/ayrılma işlevi
    async toggleParticipation(eventId) {
        try {
            const event = this.events.find(e => e.id === eventId);
            if (!event) return;
            
            const userId = this.getCurrentUserId();
            
            // Event.participants şu anda sayı olarak tanımlanmış, bunu katılımcı listesine dönüştürmeliyiz
            if (!event.participantsList) {
                event.participantsList = [];
            }
            
            let isParticipating = event.participantsList.includes(userId);
            
            if (isParticipating) {
                // Kullanıcı zaten katılımcı ise, katılımcı listesinden çıkar
                event.participantsList = event.participantsList.filter(id => id !== userId);
                event.participants = event.participantsList.length;
                
                // Veritabanını güncelle
                await this.updateEventInDatabase(event);
                
                // UI güncelle
                this.showNotification('Etkinlikten ayrıldınız.', 'info');
                this.updateEventUI(event);
            } else {
                // Maksimum katılımcı kontrolü
                if (event.participants >= event.maxParticipants) {
                    this.showNotification('Bu etkinlik için maksimum katılımcı sayısına ulaşıldı.', 'error');
                    return;
                }
                
                // Kullanıcıyı katılımcı listesine ekle
                event.participantsList.push(userId);
                event.participants = event.participantsList.length;
                
                // Veritabanını güncelle
                await this.updateEventInDatabase(event);
                
                // UI güncelle
                this.showNotification('Etkinliğe katıldınız!', 'success');
                this.updateEventUI(event);
            }
            
            // LocalStorage'ı güncelle
            localStorage.setItem('events', JSON.stringify(this.events));
        } catch (error) {
            console.error('Etkinliğe katılma/ayrılma hatası:', error);
            this.showNotification('İşlem sırasında bir hata oluştu.', 'error');
        }
    }
    
    // Etkinliği UI'da güncelle
    updateEventUI(event) {
        // Ana etkinlik listesini güncelle
        const eventCard = document.querySelector(`.event-card[data-id="${event.id}"]`);
        if (eventCard) {
            eventCard.querySelector('.participants-count').innerHTML = `<i class="fas fa-users"></i> ${event.participants}/${event.maxParticipants}`;
        }
        
        // Canlı etkinlikler listesini güncelle
        const liveEventItem = document.querySelector(`.live-event-item[data-id="${event.id}"]`);
        if (liveEventItem) {
            liveEventItem.querySelector('.detail-item:nth-child(3)').innerHTML = `<i class="fas fa-users"></i> ${event.participants}/${event.maxParticipants}`;
        }
    }
    
    // Etkinliği sil
    async deleteEvent(eventId) {
        if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
            return;
        }
        
        try {
            // Veritabanından sil
            await this.deleteEventFromDatabase(eventId);
            
            // Yerel listeden sil
            this.events = this.events.filter(event => event.id !== eventId);
            
            // LocalStorage'ı güncelle
            localStorage.setItem('events', JSON.stringify(this.events));
            
            // DOM elementlerini kaldır
            const eventCard = document.querySelector(`.event-card[data-id="${eventId}"]`);
            if (eventCard) {
                eventCard.remove();
            }
            
            const liveEventItem = document.querySelector(`.live-event-item[data-id="${eventId}"]`);
            if (liveEventItem) {
                liveEventItem.remove();
            }
            
            // Etkinlik durumunu kontrol et
            this.checkEventListStatus();
            
            // Başarı mesajı göster
            this.showNotification('Etkinlik başarıyla silindi!', 'success');
        } catch (error) {
            console.error('Etkinlik silme hatası:', error);
            this.showNotification('Etkinlik silinirken bir hata oluştu!', 'error');
        }
    }
    
    // Etkinliği düzenle
    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        // Form alanlarını doldur
        const form = document.getElementById('eventForm');
        form.querySelector('#eventName').value = event.title;
        form.querySelector('#eventDate').value = event.date;
        form.querySelector('#eventLocation').value = event.location;
        form.querySelector('#eventDescription').value = event.description;
        form.querySelector('#eventCategory').value = event.category;
        form.querySelector('#eventMaxParticipants').value = event.maxParticipants;
        
        // Form düzenleme modunda
        form.dataset.mode = 'edit';
        form.dataset.eventId = eventId;
        
        // Formu göster
        this.toggleEventForm();
    }
    
    // Etkinliği tamamla
    async finishEvent(eventId) {
        if (!confirm('Bu etkinliği tamamlandı olarak işaretlemek istediğinize emin misiniz?')) {
            return;
        }
        
        try {
            // Etkinliği bul
            const event = this.events.find(e => e.id === eventId);
            if (!event) return;
            
            // Durumu güncelle
            event.status = 'past';
            event.progress = 100;
            
            // Veritabanını güncelle
            await this.updateEventInDatabase(event);
            
            // LocalStorage'ı güncelle
            localStorage.setItem('events', JSON.stringify(this.events));
            
            // UI güncelle
            const eventCard = document.querySelector(`.event-card[data-id="${eventId}"]`);
            if (eventCard) {
                eventCard.dataset.status = 'past';
                eventCard.querySelector('.event-status').className = 'event-status past';
                eventCard.querySelector('.event-status').textContent = this.getStatusText('past');
            }
            
            const liveEventItem = document.querySelector(`.live-event-item[data-id="${eventId}"]`);
            if (liveEventItem) {
                liveEventItem.querySelector('.live-event-status').className = 'live-event-status past';
                liveEventItem.querySelector('.progress-bar').style.width = '100%';
            }
            
            // Başarı mesajı göster
            this.showNotification('Etkinlik tamamlandı olarak işaretlendi!', 'success');
        } catch (error) {
            console.error('Etkinlik tamamlama hatası:', error);
            this.showNotification('Etkinlik tamamlanırken bir hata oluştu!', 'error');
        }
    }
    
    // Event menüsünü aç/kapa
    toggleEventMenu(button) {
        const dropdown = button.nextElementSibling;
        dropdown.classList.toggle('active');
    }
    
    // Etkinliği paylaş
    shareEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        // Paylaşım bilgilerini oluştur
        const shareData = {
            title: `${event.title} - beGAK.com Etkinlik`,
            text: `${event.title} etkinliğine katılmak ister misin? ${event.date} tarihinde ${event.location} konumunda.`,
            url: `https://begak.com/etkinlik/${eventId}`
        };
        
        // Web Share API kontrolü
        if (navigator.share) {
            navigator.share(shareData)
                .then(() => this.showNotification('Etkinlik başarıyla paylaşıldı!', 'success'))
                .catch(error => {
                    console.error('Paylaşım hatası:', error);
                    this.copyShareLink(eventId);
                });
        } else {
            // Share API desteklenmiyorsa link kopyala
            this.copyShareLink(eventId);
        }
    }
    
    // Paylaşım linkini kopyala
    copyShareLink(eventId) {
        const link = `https://begak.com/etkinlik/${eventId}`;
        
        navigator.clipboard.writeText(link)
            .then(() => this.showNotification('Etkinlik linki panoya kopyalandı!', 'success'))
            .catch(() => {
                // Kopyalama başarısız olursa manuel kopyalama
                const input = document.createElement('input');
                input.value = link;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                
                this.showNotification('Etkinlik linki panoya kopyalandı!', 'success');
            });
    }
    
    // Bildirim göster
    showNotification(message, type = 'info') {
        // Toast veya bildirim elementi var mı kontrol et, yoksa oluştur
        let notification = document.getElementById('notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            document.body.appendChild(notification);
        }
        
        // Bildirimi ayarla
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        // Göster
        notification.classList.add('show');
        
        // 3 saniye sonra gizle
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Uygulama başlatıldığında
document.addEventListener('DOMContentLoaded', () => {
    // EventManager nesnesini oluştur
    const eventManager = new EventManager();
    
    // Global değişken olarak tanımla
    window.eventManager = eventManager;
}); 