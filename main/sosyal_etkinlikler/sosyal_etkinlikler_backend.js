// Event database simulation
let events = [
    {
        id: 1,
        title: 'Hoş Geldiniz Partisi',
        description: 'Yeni öğrenciler için hoş geldiniz partisi.',
        date: '2023-11-01',
        location: 'Üniversite Kampüsü',
        attendees: 50,
        status: 'active'
    }
];

// Form görünürlük kontrolü
let isFormVisible = false;

// Form görünürlüğünü değiştiren fonksiyon
function toggleEventForm() {
    const form = document.getElementById('eventForm');
    isFormVisible = !isFormVisible;
    form.style.display = isFormVisible ? 'block' : 'none';
}

// Yeni etkinlik oluşturma
function handleEventSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('eventName').value;
    const date = document.getElementById('eventDate').value;
    const location = document.getElementById('eventLocation').value;
    const description = document.getElementById('eventDesc').value;

    const newEvent = addEvent(name, description, date, location);
    createLiveEvent(newEvent);

    event.target.reset();
    toggleEventForm();
}

// Etkinlik ekleme fonksiyonu
function addEvent(title, description, date, location) {
    const newEvent = {
        id: events.length + 1,
        title: title,
        description: description,
        date: date,
        location: location,
        attendees: 0,
        status: 'active'
    };
    events.push(newEvent);
    return newEvent;
}

// Tüm etkinlikleri getir
function getEvents() {
    return events;
}

// Canlı etkinlik kartı oluşturma
function createLiveEvent(eventData) {
    const eventList = document.querySelector('.live-event-list');
    
    const eventElement = document.createElement('div');
    eventElement.className = 'live-event-item';
    
    const statusClass = eventData.status === 'active' ? 'status-active' : 'status-ended';
    
    eventElement.innerHTML = `
        <div class="event-header">
            <h3>${eventData.title}</h3>
            <span class="event-status ${statusClass}">
                ${eventData.status === 'active' ? 'Aktif' : 'Bitti'}
            </span>
        </div>
        <div class="event-details">
            <p><i class="fas fa-calendar"></i> ${formatDate(eventData.date)}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${eventData.location}</p>
            <p class="event-description">${eventData.description}</p>
        </div>
        <div class="event-actions">
            <button onclick="endEvent(this)" class="end-event-btn" ${eventData.status === 'ended' ? 'disabled' : ''}>
                <i class="fas fa-stop-circle"></i> Etkinliği Bitir
            </button>
            <button onclick="deleteEvent(this)" class="delete-event-btn">
                <i class="fas fa-trash"></i> Sil
            </button>
        </div>
    `;
    
    eventList.appendChild(eventElement);
}

// Tarihi formatlama
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Etkinliği sonlandırma
function endEvent(button) {
    const eventItem = button.closest('.live-event-item');
    const status = eventItem.querySelector('.event-status');
    const eventId = parseInt(eventItem.dataset.eventId);
    
    // Veritabanında etkinliği güncelle
    const event = events.find(e => e.id === eventId);
    if (event) {
        event.status = 'ended';
    }
    
    status.classList.remove('status-active');
    status.classList.add('status-ended');
    status.textContent = 'Bitti';
    
    button.disabled = true;
}

// Etkinliği silme
function deleteEvent(button) {
    const eventItem = button.closest('.live-event-item');
    const eventId = parseInt(eventItem.dataset.eventId);
    
    // Veritabanından etkinliği sil
    events = events.filter(e => e.id !== eventId);
    
    eventItem.remove();
}

// Sayfa yüklendiğinde mevcut etkinlikleri göster
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('eventForm');
    form.style.display = 'none';
    
    // Mevcut etkinlikleri göster
    events.forEach(event => createLiveEvent(event));
}); 