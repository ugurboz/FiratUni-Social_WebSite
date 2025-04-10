// Kulüp veritabanı simülasyonu
let clubs = [
    {
        id: 1,
        name: 'Yazılım Kulübü',
        description: 'Yazılım geliştirme ve teknoloji konularında çalışmalar yapan kulüp.',
        members: ['admin'],
        events: [
            {
                id: 1,
                title: 'Web Geliştirme Workshop',
                date: '2024-03-15',
                time: '14:00',
                location: 'Bilgisayar Laboratuvarı',
                description: 'Temel web geliştirme eğitimi ve uygulamalı çalışma.'
            }
        ],
        icon: 'fa-code'
    },
    {
        id: 2,
        name: 'Robotik Kulübü',
        description: 'Robotik ve yapay zeka projeleri üzerine çalışan kulüp.',
        members: [],
        events: [
            {
                id: 2,
                title: 'Robotik Yarışması',
                date: '2024-04-01',
                time: '10:00',
                location: 'Konferans Salonu',
                description: 'Yıllık robotik yarışması ve proje sergisi.'
            }
        ],
        icon: 'fa-robot'
    },
    {
        id: 3,
        name: 'Müzik Kulübü',
        description: 'Müzik ve sanat etkinlikleri düzenleyen kulüp.',
        members: [],
        events: [
            {
                id: 3,
                title: 'Bahar Konseri',
                date: '2024-03-20',
                time: '19:00',
                location: 'Açık Hava Amfisi',
                description: 'Geleneksel bahar konseri ve müzik şöleni.'
            }
        ],
        icon: 'fa-music'
    },
    {
        id: 4,
        name: 'Spor Kulübü',
        description: 'Spor aktiviteleri ve turnuvalar düzenleyen kulüp.',
        members: [],
        events: [
            {
                id: 4,
                title: 'Futbol Turnuvası',
                date: '2024-03-25',
                time: '15:00',
                location: 'Üniversite Stadyumu',
                description: 'Yıllık fakülteler arası futbol turnuvası.'
            }
        ],
        icon: 'fa-futbol'
    },
    {
        id: 5,
        name: 'Fotoğrafçılık Kulübü',
        description: 'Fotoğrafçılık ve görsel sanatlar üzerine çalışan kulüp.',
        members: [],
        events: [
            {
                id: 5,
                title: 'Fotoğraf Sergisi',
                date: '2024-04-10',
                time: '13:00',
                location: 'Sergi Salonu',
                description: 'Öğrenci fotoğraflarından oluşan sergi.'
            }
        ],
        icon: 'fa-camera'
    },
    {
        id: 6,
        name: 'Tiyatro Kulübü',
        description: 'Tiyatro ve sahne sanatları üzerine çalışan kulüp.',
        members: [],
        events: [
            {
                id: 6,
                title: 'Tiyatro Gösterisi',
                date: '2024-04-15',
                time: '20:00',
                location: 'Konferans Salonu',
                description: 'Öğrenci oyunu: "Hayat Bir Sahne".'
            }
        ],
        icon: 'fa-theater-masks'
    }
];

// Kulüpleri getir
async function getClubs() {
    try {
        return clubs;
    } catch (error) {
        console.error('Kulüpler getirilirken hata:', error);
        throw error;
    }
}

// Kulübe üye ol
async function joinClub(clubId) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            throw new Error('Kullanıcı oturumu bulunamadı');
        }

        const club = clubs.find(c => c.id === clubId);
        if (!club) {
            throw new Error('Kulüp bulunamadı');
        }

        if (club.members.includes(user.username)) {
            throw new Error('Zaten bu kulübün üyesisiniz');
        }

        club.members.push(user.username);
        return club;
    } catch (error) {
        console.error('Kulübe katılırken hata:', error);
        throw error;
    }
}

// Kulüpten ayrıl
async function leaveClub(clubId) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            throw new Error('Kullanıcı oturumu bulunamadı');
        }

        const club = clubs.find(c => c.id === clubId);
        if (!club) {
            throw new Error('Kulüp bulunamadı');
        }

        const memberIndex = club.members.indexOf(user.username);
        if (memberIndex === -1) {
            throw new Error('Bu kulübün üyesi değilsiniz');
        }

        club.members.splice(memberIndex, 1);
        return club;
    } catch (error) {
        console.error('Kulüpten ayrılırken hata:', error);
        throw error;
    }
}

// Etkinlik oluştur
async function createEvent(clubId, eventData) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            throw new Error('Kullanıcı oturumu bulunamadı');
        }

        const club = clubs.find(c => c.id === clubId);
        if (!club) {
            throw new Error('Kulüp bulunamadı');
        }

        if (!club.members.includes(user.username)) {
            throw new Error('Bu kulübün üyesi değilsiniz');
        }

        const newEvent = {
            id: club.events.length + 1,
            ...eventData,
            createdBy: user.username,
            createdAt: new Date().toISOString()
        };

        club.events.push(newEvent);
        return newEvent;
    } catch (error) {
        console.error('Etkinlik oluşturulurken hata:', error);
        throw error;
    }
}

// Etkinlikleri getir
async function getClubEvents(clubId) {
    try {
        const club = clubs.find(c => c.id === clubId);
        if (!club) {
            throw new Error('Kulüp bulunamadı');
        }

        return club.events;
    } catch (error) {
        console.error('Etkinlikler getirilirken hata:', error);
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