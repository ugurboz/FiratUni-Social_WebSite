// Bildirim fonksiyonu
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    notificationMessage.textContent = message;
    notification.className = 'notification'; // Reset classes
    notification.classList.add('show', type);
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Etkinliğe katılma fonksiyonu
function joinEvent(eventId) {
    // Burada sunucuya katılım isteği gönderilebilir
    console.log(`Etkinliğe katılım isteği gönderildi: ${eventId}`);
    showNotification('Etkinliğe başarıyla katıldınız!');
    
    // Katıl butonunu güncelle
    const joinButton = document.querySelector(`[data-event-id="${eventId}"]`);
    if (joinButton) {
        joinButton.textContent = 'Katıldınız';
        joinButton.disabled = true;
        joinButton.classList.add('joined');
    }
}

// Canlı etkinlikleri yükle
function loadLiveEvents() {
    const eventsContainer = document.querySelector('.events-container');
    if (!eventsContainer) return;
    
    // Örnek etkinlik verileri (gerçek uygulamada API'den alınabilir)
    const events = [
        { id: 1, title: 'Yazılım Geliştirme Atölyesi', time: '14:00', date: '25 Temmuz', location: 'Mühendislik Fakültesi' },
        { id: 2, title: 'Kariyer Günleri', time: '10:30', date: '27 Temmuz', location: 'Kongre Merkezi' },
        { id: 3, title: 'Mezuniyet Töreni', time: '16:00', date: '30 Temmuz', location: 'Spor Salonu' }
    ];
    
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
                    <button class="join-event-btn" data-event-id="${event.id}" onclick="joinEvent(${event.id})">Katıl</button>
                </div>
            </div>
        `;
    });
    
    eventsContainer.innerHTML = eventsHTML;
}

// Sayfa yüklendiğinde etkinlikleri yükle
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    loadLiveEvents();
}); 