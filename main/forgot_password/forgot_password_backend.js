const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const { getDb } = require('../../db/config');
require('dotenv').config();

// Şifre sıfırlama kodu gönderme
async function sendResetCode(email) {
    try {
        console.log('Şifre sıfırlama kodu gönderme başladı:', email);
        const db = await getDb();
        const usersCollection = db.collection('users');

        // Kullanıcıyı kontrol et
        const user = await usersCollection.findOne({ email });
        if (!user) {
            console.log('Kullanıcı bulunamadı:', email);
            return { success: false, message: 'Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı.' };
        }

        // 6 haneli doğrulama kodu oluştur
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetCodeExpires = new Date(Date.now() + 60000); // 1 dakika

        // Kodu veritabanına kaydet
        await usersCollection.updateOne(
            { email },
            { 
                $set: { 
                    resetCode,
                    resetCodeExpires
                }
            }
        );

        // E-posta gönder
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: {
                name: 'beGAKKOM',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'beGAKKOM - Şifre Sıfırlama Kodu',
            html: `
                <!DOCTYPE html>
                <html lang="tr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Şifre Sıfırlama</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            margin: 0;
                            padding: 0;
                            background-color: #f8f9fa;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .email-wrapper {
                            background: #ffffff;
                            border-radius: 12px;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                            overflow: hidden;
                        }
                        .header {
                            background: linear-gradient(135deg, #4361ee, #7209b7);
                            padding: 30px;
                            text-align: center;
                        }
                        .logo {
                            width: 80px;
                            height: 80px;
                            background: #ffffff;
                            border-radius: 50%;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            margin-bottom: 15px;
                        }
                        .logo i {
                            font-size: 40px;
                            color: #4361ee;
                        }
                        .brand-name {
                            color: #ffffff;
                            font-size: 24px;
                            font-weight: bold;
                            margin: 0;
                        }
                        .brand-tagline {
                            color: rgba(255, 255, 255, 0.9);
                            font-size: 14px;
                            margin: 5px 0 0;
                        }
                        .content {
                            padding: 30px;
                            text-align: center;
                        }
                        .title {
                            color: #333;
                            font-size: 20px;
                            font-weight: 600;
                            margin: 0 0 20px;
                        }
                        .reset-code {
                            background: #f8f9fa;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            padding: 15px;
                            margin: 20px 0;
                            font-size: 24px;
                            font-weight: bold;
                            color: #4361ee;
                            letter-spacing: 5px;
                        }
                        .message {
                            color: #666;
                            font-size: 16px;
                            margin: 20px 0;
                        }
                        .warning {
                            color: #dc2626;
                            font-size: 14px;
                            margin: 20px 0;
                        }
                        .footer {
                            background: #f8f9fa;
                            padding: 20px;
                            text-align: center;
                            font-size: 12px;
                            color: #666;
                            border-top: 1px solid #e0e0e0;
                        }
                        @media only screen and (max-width: 600px) {
                            .container {
                                padding: 10px;
                            }
                            .content {
                                padding: 20px;
                            }
                            .reset-code {
                                font-size: 20px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="email-wrapper">
                            <div class="header">
                                <div class="logo">
                                    <i class="fas fa-users"></i>
                                </div>
                                <h1 class="brand-name">beGAKKOM</h1>
                                <p class="brand-tagline">Fırat Üniversitesi Sosyal Platformu</p>
                            </div>
                            <div class="content">
                                <h2 class="title">Şifre Sıfırlama Kodu</h2>
                                <p class="message">
                                    Şifrenizi sıfırlamak için aşağıdaki kodu kullanın. Bu kod 1 dakika içinde geçerliliğini yitirecektir.
                                </p>
                                <div class="reset-code">
                                    ${resetCode}
                                </div>
                                <p class="message">
                                    Eğer bu işlemi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın ve hesabınızın güvenliği için şifrenizi değiştirin.
                                </p>
                                <p class="warning">
                                    ⚠️ Güvenliğiniz için bu kodu kimseyle paylaşmayın.
                                </p>
                            </div>
                            <div class="footer">
                                <p>© 2024 beGAKKOM - Tüm hakları saklıdır.</p>
                                <p>Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayınız.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Şifre sıfırlama kodu gönderildi:', email);

        return { 
            success: true, 
            message: 'Şifre sıfırlama kodu e-posta adresinize gönderildi.' 
        };
    } catch (error) {
        console.error('Şifre sıfırlama kodu gönderme hatası:', error);
        return { 
            success: false, 
            message: 'Şifre sıfırlama kodu gönderilirken bir hata oluştu.' 
        };
    }
}

// Şifre sıfırlama kodunu doğrula
async function verifyResetCode(email, code) {
    try {
        console.log('Kod doğrulama başladı:', { email, code });
        const db = await getDb();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ email });
        if (!user) {
            console.log('Kullanıcı bulunamadı:', email);
            return { success: false, message: 'Kullanıcı bulunamadı.' };
        }

        if (!user.resetCode || !user.resetCodeExpires) {
            console.log('Geçersiz sıfırlama kodu:', email);
            return { success: false, message: 'Geçersiz sıfırlama kodu.' };
        }

        const now = new Date();
        if (now > user.resetCodeExpires) {
            console.log('Kod süresi dolmuş:', email);
            return { success: false, message: 'Sıfırlama kodunun süresi dolmuş.' };
        }

        if (user.resetCode !== code) {
            console.log('Kod eşleşmiyor:', email);
            return { success: false, message: 'Geçersiz sıfırlama kodu.' };
        }

        console.log('Kod doğrulandı:', email);
        return { success: true, message: 'Kod doğrulandı.' };
    } catch (error) {
        console.error('Kod doğrulama hatası:', error);
        return { success: false, message: 'Kod doğrulanırken bir hata oluştu.' };
    }
}

// Şifreyi güncelle
async function updatePassword(email, newPassword) {
    try {
        console.log('Şifre güncelleme başladı:', email);
        const db = await getDb();
        const usersCollection = db.collection('users');

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await usersCollection.updateOne(
            { email },
            { 
                $set: { password: hashedPassword },
                $unset: { resetCode: "", resetCodeExpires: "" }
            }
        );

        console.log('Şifre güncellendi:', email);
        return { success: true, message: 'Şifreniz başarıyla güncellendi.' };
    } catch (error) {
        console.error('Şifre güncelleme hatası:', error);
        return { success: false, message: 'Şifre güncellenirken bir hata oluştu.' };
    }
}

module.exports = {
    sendResetCode,
    verifyResetCode,
    updatePassword
}; 