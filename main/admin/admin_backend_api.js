// Dashboard stats
function getAdminStats() {
  // Örnek veri, gerçek uygulamada veritabanından alınacak
  return {
    totalUsers: 0,
    activeEvents: 0,
    totalClubs: 0
  };
}

// Clubs
let clubs = [];
function getClubs() {
  return clubs;
}
function addClub(club) {
  club.id = Date.now();
  clubs.push(club);
  return { success: true, club };
}
function editClub(id, updatedClub) {
  const idx = clubs.findIndex(c => c.id === id);
  if (idx !== -1) {
    clubs[idx] = { ...clubs[idx], ...updatedClub };
    return { success: true, club: clubs[idx] };
  }
  return { success: false };
}
function deleteClub(id) {
  clubs = clubs.filter(c => c.id !== id);
  return { success: true };
}

// Events
let events = [];
function getEvents() {
  return events;
}
function addEvent(event) {
  event.id = Date.now();
  events.push(event);
  return { success: true, event };
}
function editEvent(id, updatedEvent) {
  const idx = events.findIndex(e => e.id === id);
  if (idx !== -1) {
    events[idx] = { ...events[idx], ...updatedEvent };
    return { success: true, event: events[idx] };
  }
  return { success: false };
}
function deleteEvent(id) {
  events = events.filter(e => e.id !== id);
  return { success: true };
}

// Users
let users = [];
function getUsers() {
  return users;
}
function setUserStatus(id, status) {
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) {
    users[idx].status = status;
    return { success: true, user: users[idx] };
  }
  return { success: false };
}
function deleteUser(id) {
  users = users.filter(u => u.id !== id);
  return { success: true };
}

// Settings
let settings = {
  siteName: 'beGAK.com',
  maintenance: false,
  maxFileSize: 5
};
function getSettings() {
  return settings;
}
function updateSettings(newSettings) {
  settings = { ...settings, ...newSettings };
  return { success: true, settings };
}

// Export (Node.js veya başka bir ortamda kullanılacaksa)
if (typeof module !== 'undefined') {
  module.exports = {
    getAdminStats,
    getClubs, addClub, editClub, deleteClub,
    getEvents, addEvent, editEvent, deleteEvent,
    getUsers, setUserStatus, deleteUser,
    getSettings, updateSettings
  };
} 