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
        
        // Event listener'ları bağla
        this.bindEventListeners();
        
        // Başlangıçta etkinlikleri göster
        this.renderEvents();
        this.renderLiveEvents();
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
    
    handleEventSubmit(e) {
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
            maxParticipants: 50, // Varsayılan değer
            progress: 0
        };
        
        // Etkinliği ekle
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
        
        // Bilgi mesajı göster
        alert('Etkinlik başarıyla oluşturuldu!');
    }
    
    // Etkinliği etkinlikler bölümüne ekle
    addEventToDOM(event) {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.dataset.status = event.status;
        
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
                <button class="action-btn join-btn"><i class="fas fa-user-plus"></i> Katıl</button>
                <button class="action-btn share-btn"><i class="fas fa-share-alt"></i> Paylaş</button>
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
}

// Uygulama başlatıldığında
document.addEventListener('DOMContentLoaded', () => {
    // EventManager nesnesini oluştur
    const eventManager = new EventManager();
    
    // Global değişken olarak tanımla
    window.eventManager = eventManager;
}); 