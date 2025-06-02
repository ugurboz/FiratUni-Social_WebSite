const { pool } = require('./config');
const bcrypt = require('bcrypt');

// Sample data for testing
const seed = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    await pool.execute('TRUNCATE TABLE users');
    await pool.execute('TRUNCATE TABLE posts');
    await pool.execute('TRUNCATE TABLE comments');
    await pool.execute('TRUNCATE TABLE likes');
    await pool.execute('TRUNCATE TABLE clubs');
    await pool.execute('TRUNCATE TABLE club_memberships');
    await pool.execute('TRUNCATE TABLE events');
    await pool.execute('TRUNCATE TABLE event_participants');
    await pool.execute('TRUNCATE TABLE messages');
    await pool.execute('TRUNCATE TABLE notifications');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('All tables truncated. Starting data insertion...');

    // Hash for password "password123"
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Insert test users
    const [usersResult] = await pool.execute(`
      INSERT INTO users (firstName, lastName, email, password, studentNumber, department, year, bio, interests, role)
      VALUES
        ('Admin', 'User', 'admin@firat.edu.tr', ?, '100000', 'Sistem Yönetimi', 4, 'Site admin', 'Yazılım, Teknoloji', 'admin'),
        ('Ayşe', 'Demir', 'ayse.demir@firat.edu.tr', ?, '201001', 'Bilgisayar Mühendisliği', 3, 'Bilgisayar mühendisliği öğrencisiyim ve yapay zeka ile ilgileniyorum.', 'Yapay Zeka, Web Geliştirme, Kitap Okuma', 'student'),
        ('Mehmet', 'Yılmaz', 'mehmet.yilmaz@firat.edu.tr', ?, '201002', 'Elektrik-Elektronik Mühendisliği', 2, 'Elektronik devreler konusunda çalışmalar yapıyorum.', 'Elektronik, Robotik, Spor', 'student'),
        ('Zeynep', 'Kaya', 'zeynep.kaya@firat.edu.tr', ?, '201003', 'İşletme', 4, 'Dijital pazarlama alanında uzmanlaşmak istiyorum.', 'Pazarlama, Sosyal Medya, Fotoğrafçılık', 'student'),
        ('Can', 'Öztürk', 'can.ozturk@firat.edu.tr', ?, '201004', 'Makine Mühendisliği', 3, 'Enerji sistemleri üzerine çalışıyorum.', 'Otomotiv, Enerji, Futbol', 'student'),
        ('Selin', 'Şahin', 'selin.sahin@firat.edu.tr', ?, '201005', 'Psikoloji', 2, 'Klinik psikoloji alanında kariyer hedefliyorum.', 'Psikoloji, Sanat, Müzik', 'student'),
        ('Prof. Ali', 'Yıldız', 'ali.yildiz@firat.edu.tr', ?, 'PROF001', 'Bilgisayar Mühendisliği', null, 'Bilgisayar Mühendisliği bölümünde profesör olarak görev yapmaktayım.', 'Eğitim, Araştırma, Teknoloji', 'faculty')
    `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword]);

    console.log(`Inserted ${usersResult.affectedRows} users.`);

    // Insert test clubs
    const [clubsResult] = await pool.execute(`
      INSERT INTO clubs (name, description, logo)
      VALUES
        ('Yazılım ve Teknoloji Kulübü', 'Yazılım ve teknoloji alanında etkinlikler düzenleyen kulüp.', null),
        ('Müzik Kulübü', 'Müzik severleri bir araya getiren, konserler ve etkinlikler düzenleyen kulüp.', null),
        ('Spor Kulübü', 'Farklı spor dallarında etkinlikler organize eden kulüp.', null),
        ('Girişimcilik Kulübü', 'Öğrencilere girişimcilik becerilerini geliştirme fırsatı sunan kulüp.', null)
    `);

    console.log(`Inserted ${clubsResult.affectedRows} clubs.`);

    // Insert club memberships
    const [membershipsResult] = await pool.execute(`
      INSERT INTO club_memberships (clubId, userId, role)
      VALUES
        (1, 2, 'president'),
        (1, 3, 'member'),
        (1, 4, 'member'),
        (2, 5, 'president'),
        (2, 6, 'admin'),
        (3, 3, 'president'),
        (3, 4, 'member'),
        (4, 4, 'president'),
        (4, 2, 'member'),
        (4, 5, 'member')
    `);

    console.log(`Inserted ${membershipsResult.affectedRows} club memberships.`);

    // Insert test posts
    const [postsResult] = await pool.execute(`
      INSERT INTO posts (userId, content, image, likes)
      VALUES
        (2, 'Merhaba arkadaşlar! Bu dönem yazılım projeleri dersinde geliştirdiğimiz web uygulaması hakkında görüşlerinizi almak isterim.', null, 5),
        (3, 'Bugün laboratuvarda yaptığımız elektronik devre çalışmasını paylaşmak istiyorum. Güneş enerjili şarj cihazı projemiz başarıyla çalıştı!', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1640&q=80', 8),
        (4, 'Gelecek hafta pazarlama kulübümüzün düzenleyeceği dijital pazarlama eğitimi için kayıt olmayı unutmayın! Online pazarlama stratejileri konusunda değerli bilgiler edinebilirsiniz.', null, 3),
        (5, 'Enerji verimliliği üzerine hazırladığım makale dergide yayınlandı. İlgilenen arkadaşlara link paylaşabilirim.', null, 12),
        (6, 'Psikoloji bölümü öğrencileri için faydalı olabilecek bir kaynak listesi oluşturdum. İsteyen olursa mesaj atabilir.', null, 6),
        (7, 'Bilgisayar Mühendisliği bölümü 3. sınıf öğrencilerine duyuru: Yarın saat 14:00''da laboratuvar uygulaması olacaktır. Katılım zorunludur.', null, 0)
    `);

    console.log(`Inserted ${postsResult.affectedRows} posts.`);

    // Insert test comments
    const [commentsResult] = await pool.execute(`
      INSERT INTO comments (postId, userId, content)
      VALUES
        (1, 3, 'Web uygulaması gayet başarılı olmuş, tebrik ederim.'),
        (1, 4, 'Frontend kısmında yardıma ihtiyacın olursa destek olabilirim.'),
        (2, 2, 'Çok yaratıcı bir proje, devamını merakla bekliyorum.'),
        (3, 2, 'Kesinlikle katılacağım, çok faydalı olacak gibi.'),
        (3, 5, 'Etkinlik saati tam olarak ne zaman?'),
        (4, 3, 'Makale linkini paylaşabilir misin?'),
        (5, 4, 'Kaynak listesini bana da gönderebilir misin?')
    `);

    console.log(`Inserted ${commentsResult.affectedRows} comments.`);

    // Insert test likes
    const [likesResult] = await pool.execute(`
      INSERT INTO likes (postId, userId)
      VALUES
        (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
        (2, 2), (2, 4), (2, 5), (2, 6), (2, 7), (2, 1), (2, 3),
        (3, 2), (3, 5), (3, 7),
        (4, 2), (4, 3), (4, 4), (4, 6), (4, 7), (4, 1),
        (5, 2), (5, 3), (5, 4), (5, 7), (5, 1)
    `);

    console.log(`Inserted ${likesResult.affectedRows} likes.`);

    // Insert test events
    const currentDate = new Date();
    const tomorrowDate = new Date(currentDate);
    tomorrowDate.setDate(currentDate.getDate() + 1);
    
    const yesterdayDate = new Date(currentDate);
    yesterdayDate.setDate(currentDate.getDate() - 1);
    
    const nextWeekDate = new Date(currentDate);
    nextWeekDate.setDate(currentDate.getDate() + 7);
    
    const lastWeekDate = new Date(currentDate);
    lastWeekDate.setDate(currentDate.getDate() - 7);

    const [eventsResult] = await pool.execute(`
      INSERT INTO events (name, description, location, startDate, endDate, maxParticipants, category, status, createdBy, clubId)
      VALUES
        ('Kodlama Workshop', 'Web geliştirme teknolojileri hakkında workshop etkinliği.', 'Mühendislik Fakültesi Lab 3', ?, ?, 30, 'academic', 'upcoming', 2, 1),
        ('Müzik Festivali', 'Fırat Üniversitesi bahar dönemi müzik festivali.', 'Merkez Kampüs Amfi', ?, ?, 200, 'cultural', 'ongoing', 5, 2),
        ('Futbol Turnuvası', 'Bölümler arası futbol turnuvası.', 'Spor Kompleksi', ?, ?, 100, 'sports', 'past', 3, 3),
        ('Girişimcilik Semineri', 'Başarılı girişimcilerle söyleşi.', 'İktisadi ve İdari Bilimler Fakültesi Konferans Salonu', ?, null, 80, 'academic', 'upcoming', 4, 4)
    `, [nextWeekDate, nextWeekDate, currentDate, tomorrowDate, lastWeekDate, yesterdayDate, nextWeekDate]);

    console.log(`Inserted ${eventsResult.affectedRows} events.`);

    // Insert test event participants
    const [participantsResult] = await pool.execute(`
      INSERT INTO event_participants (eventId, userId, status)
      VALUES
        (1, 3, 'registered'),
        (1, 4, 'registered'),
        (1, 5, 'registered'),
        (2, 2, 'registered'),
        (2, 6, 'registered'),
        (3, 2, 'attended'),
        (3, 4, 'attended'),
        (3, 5, 'attended'),
        (4, 2, 'registered'),
        (4, 3, 'registered'),
        (4, 5, 'registered'),
        (4, 6, 'registered')
    `);

    console.log(`Inserted ${participantsResult.affectedRows} event participants.`);

    // Insert test messages
    const [messagesResult] = await pool.execute(`
      INSERT INTO messages (senderId, receiverId, content, isRead)
      VALUES
        (2, 3, 'Merhaba, projeye katılmak ister misin?', 1),
        (3, 2, 'Evet, çok sevinirim. Ne zaman başlıyoruz?', 1),
        (2, 3, 'Yarın saat 15:00''da kütüphanede buluşalım.', 1),
        (4, 5, 'Pazarlama sunumu için kaynak bulabildin mi?', 0),
        (5, 4, 'Birkaç makale buldum, sana mail atacağım.', 1),
        (6, 2, 'Merhaba, psikoloji kulübü etkinlikleri hakkında bilgi alabilir miyim?', 0),
        (7, 3, 'Yarınki laboratuvar çalışmasında grupları belirleyelim.', 0)
    `);

    console.log(`Inserted ${messagesResult.affectedRows} messages.`);

    // Insert test notifications
    const [notificationsResult] = await pool.execute(`
      INSERT INTO notifications (userId, type, content, isRead, relatedId)
      VALUES
        (2, 'post_like', 'Mehmet Yılmaz gönderinizi beğendi.', 0, 1),
        (2, 'comment', 'Zeynep Kaya gönderinize yorum yaptı.', 0, 1),
        (3, 'event_invite', 'Yazılım ve Teknoloji Kulübü yeni bir etkinlik düzenledi: Kodlama Workshop', 1, 1),
        (4, 'club_invite', 'Spor Kulübüne katılmak ister misiniz?', 0, 3),
        (5, 'message', 'Zeynep Kaya size mesaj gönderdi.', 1, null),
        (6, 'system', 'Profiliniz başarıyla güncellendi.', 0, null)
    `);

    console.log(`Inserted ${notificationsResult.affectedRows} notifications.`);

    console.log('Database seeding completed successfully!');
    
    return { success: true, message: 'Database seeded successfully' };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error: error.message };
  }
};

// Execute the seed function if this script is run directly
if (require.main === module) {
  seed()
    .then(result => {
      if (result.success) {
        console.log(result.message);
        process.exit(0);
      } else {
        console.error(result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = seed; 