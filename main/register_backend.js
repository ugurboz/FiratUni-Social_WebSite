// Kullanıcı veritabanı
const users = [];

// Kayıt işlemi
async function handleRegister(studentNumber, password, confirmPassword, name) {
    return new Promise((resolve, reject) => {
        try {
            // Öğrenci numarası kontrolü
            if (!studentNumber || studentNumber.length !== 10) {
                reject(new Error('Geçerli bir öğrenci numarası giriniz.'));
                return;
            }

            // E-posta oluştur
            const email = `${studentNumber}@firat.edu.tr`;

            // Şifre kontrolü
            if (password !== confirmPassword) {
                reject(new Error('Şifreler eşleşmiyor.'));
                return;
            }

            // Şifre güvenliği kontrolü
            if (password.length < 6) {
                reject(new Error('Şifre en az 6 karakter olmalıdır.'));
                return;
            }

            // Kullanıcı adı kontrolü
            if (users.some(user => user.studentNumber === studentNumber)) {
                reject(new Error('Bu öğrenci numarası ile kayıtlı bir kullanıcı zaten var.'));
                return;
            }

            // Yeni kullanıcı oluştur
            const newUser = {
                studentNumber,
                email,
                password,
                name,
                joinDate: new Date().toISOString()
            };

            // Kullanıcıyı veritabanına ekle
            users.push(newUser);

            resolve({
                success: true,
                message: 'Kayıt başarılı! Giriş yapabilirsiniz.',
                user: {
                    studentNumber: newUser.studentNumber,
                    email: newUser.email,
                    name: newUser.name
                }
            });
        } catch (error) {
            reject(error);
        }
    });
} 