# Fırat Üniversitesi Sosyal Web Sitesi

Fırat Üniversitesi öğrencileri ve personeli için modern bir sosyal ağ platformu.

## Özellikler

- Kullanıcı kimlik doğrulama ve profilleri
- Haber akışı ve güncellemeler
- Etkinlik duyuruları
- Akademik kaynak paylaşımı
- Öğrenci kulüpleri ve organizasyonlar
- Kampüs haritası entegrasyonu
- Gerçek zamanlı bildirimler

## Teknoloji Altyapısı

### Ön Yüz (Frontend)
- React.js
- Material-UI
- Redux (Durum yönetimi için)
- Axios (API çağrıları için)

### Arka Yüz (Backend)
- Node.js
- Express.js
- MongoDB
- JWT (Kimlik doğrulama için)
- Socket.io (Gerçek zamanlı özellikler için)

## Başlangıç

### Gereksinimler
- Node.js (v14 veya üzeri)
- MongoDB
- npm veya yarn

### Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/yourusername/FiratUni-Social_WebSite.git
cd FiratUni-Social_WebSite
```

2. Bağımlılıkları yükleyin:
```bash
# Backend bağımlılıklarını yükle
cd backend
npm install

# Frontend bağımlılıklarını yükle
cd ../frontend
npm install
```

3. Ortam değişkenlerini ayarlayın:
Frontend ve backend dizinlerinde gerekli yapılandırmalarla `.env` dosyaları oluşturun.

4. Geliştirme sunucularını başlatın:
```bash
# Backend sunucusunu başlat
cd backend
npm run dev

# Frontend sunucusunu başlat
cd frontend
npm start
```

## Proje Yapısı

```
FiratUni-Social_WebSite/
├── frontend/           # React ön yüz uygulaması
├── backend/           # Node.js arka yüz sunucusu
├── docs/             # Proje dokümantasyonu
└── README.md         # Proje genel bakışı
```

## Katkıda Bulunma

1. Projeyi fork edin
2. Özellik dalınızı oluşturun (`git checkout -b feature/YeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Dalınıza push yapın (`git push origin feature/YeniOzellik`)
5. Bir Pull Request açın

## Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - detaylar için LICENSE dosyasına bakın.
